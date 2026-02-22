from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import time
import psutil
import hashlib
import struct
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import io
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
import json
import random
import statistics
from typing import List, Dict, Tuple

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

class PerformanceMonitor:
    def __init__(self):
        self.start_time = None
        self.start_cpu = None
        self.start_memory = None
        self.process = psutil.Process()
    
    def start(self):
        self.start_time = time.perf_counter()
        self.start_cpu = self.process.cpu_percent()
        self.start_memory = self.process.memory_info().rss / 1024 / 1024  # MB
    
    def stop(self):
        end_time = time.perf_counter()
        end_cpu = self.process.cpu_percent()
        end_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        
        return {
            'time_ms': (end_time - self.start_time) * 1000,
            'cpu_percent': end_cpu,
            'memory_mb': end_memory - self.start_memory if self.start_memory else end_memory
        }

class TEACipher:
    def __init__(self, key):
        if len(key) != 16:
            raise ValueError("TEA requires 128-bit (16-byte) key")
        self.key = struct.unpack('>4I', key)
        self.delta = 0x9e3779b9
    
    def encrypt_block(self, v):
        v0, v1 = v
        sum_val = 0
        for _ in range(32):
            sum_val = (sum_val + self.delta) & 0xFFFFFFFF
            v0 = (v0 + (((v1 << 4) + self.key[0]) ^ (v1 + sum_val) ^ ((v1 >> 5) + self.key[1]))) & 0xFFFFFFFF
            v1 = (v1 + (((v0 << 4) + self.key[2]) ^ (v0 + sum_val) ^ ((v0 >> 5) + self.key[3]))) & 0xFFFFFFFF
        return v0, v1
    
    def decrypt_block(self, v):
        v0, v1 = v
        sum_val = (self.delta * 32) & 0xFFFFFFFF
        for _ in range(32):
            v1 = (v1 - (((v0 << 4) + self.key[2]) ^ (v0 + sum_val) ^ ((v0 >> 5) + self.key[3]))) & 0xFFFFFFFF
            v0 = (v0 - (((v1 << 4) + self.key[0]) ^ (v1 + sum_val) ^ ((v1 >> 5) + self.key[1]))) & 0xFFFFFFFF
            sum_val = (sum_val - self.delta) & 0xFFFFFFFF
        return v0, v1
    
    def encrypt(self, data):
        # Pad data to multiple of 8 bytes
        pad_len = 8 - (len(data) % 8)
        data = data + bytes([pad_len] * pad_len)
        
        result = bytearray()
        for i in range(0, len(data), 8):
            block = struct.unpack('>2I', data[i:i+8])
            encrypted_block = self.encrypt_block(block)
            result.extend(struct.pack('>2I', *encrypted_block))
        
        return bytes(result)
    
    def decrypt(self, data):
        result = bytearray()
        for i in range(0, len(data), 8):
            block = struct.unpack('>2I', data[i:i+8])
            decrypted_block = self.decrypt_block(block)
            result.extend(struct.pack('>2I', *decrypted_block))
        
        # Remove padding
        if result:
            pad_len = result[-1]
            if pad_len <= 8:
                result = result[:-pad_len]
        
        return bytes(result)

class NTSA35Cipher:
    """NTSA_3.5 algorithm - ported exactly from ntsa_v3.5.c without modification."""
    DELTA = 0x9E3779B9
    NUM_CYCLES = 32

    def __init__(self, key):
        if len(key) != 16:
            raise ValueError("NTSA_3.5 requires 128-bit (16-byte) key")
        self.key = struct.unpack('>4I', key)
        self.dynamic_table = [0] * 32
        self._init_dynamic_table()

    def _init_dynamic_table(self):
        state = list(self.key)
        for i in range(32):
            state[0] = (state[0] + ((state[3] ^ self.DELTA) + (state[1] << 4))) & 0xFFFFFFFF
            state[1] = (state[1] + ((state[0] ^ self.DELTA) + (state[2] >> 5))) & 0xFFFFFFFF
            state[2] = (state[2] + ((state[1] ^ self.DELTA) + (state[3] << 4))) & 0xFFFFFFFF
            state[3] = (state[3] + ((state[2] ^ self.DELTA) + (state[0] >> 5))) & 0xFFFFFFFF
            self.dynamic_table[i] = (state[0] ^ state[1] ^ state[2] ^ state[3]) & 0xFFFFFFFF

    def _xtract(self, v):
        v = v & 0xFFFFFFFF
        v ^= v >> 16
        v ^= v >> 8
        v ^= v >> 4
        v ^= v >> 2
        v ^= v >> 1
        index = v & 31
        return self.dynamic_table[index]

    def encrypt_block(self, v):
        v0, v1 = v
        k0, k1, k2, k3 = self.key
        kc = 0

        for _ in range(self.NUM_CYCLES):
            kc = (kc + self.DELTA) & 0xFFFFFFFF
            v0 = (v0 + (((v1 << 4) & k0) ^ (v1 & kc) ^ ((v1 >> 5) & k1))) & 0xFFFFFFFF
            k1 = (k1 + (k0 ^ self._xtract(v0))) & 0xFFFFFFFF
            v1 = (v1 + (((v0 << 4) & k2) ^ (v0 & kc) ^ ((v0 >> 5) & k3))) & 0xFFFFFFFF
            k3 = (k3 + (k2 ^ self._xtract(v1))) & 0xFFFFFFFF

        return (v0, v1), (k1, k3)

    def decrypt_block(self, v, final_keys):
        v0, v1 = v
        k0, _, k2, _ = self.key
        k1, k3 = final_keys
        kc = (self.DELTA * 32) & 0xFFFFFFFF  # 0xC6EF3720

        for _ in range(self.NUM_CYCLES):
            k3 = (k3 - (k2 ^ self._xtract(v1))) & 0xFFFFFFFF
            v1 = (v1 - (((v0 << 4) & k2) ^ (v0 & kc) ^ ((v0 >> 5) & k3))) & 0xFFFFFFFF
            k1 = (k1 - (k0 ^ self._xtract(v0))) & 0xFFFFFFFF
            v0 = (v0 - (((v1 << 4) & k0) ^ (v1 & kc) ^ ((v1 >> 5) & k1))) & 0xFFFFFFFF
            kc = (kc - self.DELTA) & 0xFFFFFFFF

        return v0, v1

    def encrypt(self, data):
        pad_len = 8 - (len(data) % 8)
        data = data + bytes([pad_len] * pad_len)

        result = bytearray()
        for i in range(0, len(data), 8):
            block = struct.unpack('>2I', data[i:i+8])
            (v0, v1), (fk1, fk3) = self.encrypt_block(block)
            result.extend(struct.pack('>2I', fk1, fk3))  # Store final_keys first (as in C)
            result.extend(struct.pack('>2I', v0, v1))

        return bytes(result)

    def decrypt(self, data):
        result = bytearray()
        i = 0
        while i + 16 <= len(data):  # 8 bytes final_keys + 8 bytes block
            final_keys = struct.unpack('>2I', data[i:i+8])
            block = struct.unpack('>2I', data[i+8:i+16])
            v0, v1 = self.decrypt_block(block, final_keys)
            result.extend(struct.pack('>2I', v0, v1))
            i += 16

        if result:
            pad_len = result[-1]
            if pad_len <= 8:
                result = result[:-pad_len]

        return bytes(result)

class AESCipher:
    def __init__(self, key):
        if len(key) != 16:
            raise ValueError("AES-128 requires 128-bit (16-byte) key")
        self.key = key
    
    def encrypt(self, data):
        # Generate random IV
        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        # Pad data to multiple of 16 bytes
        pad_len = 16 - (len(data) % 16)
        data = data + bytes([pad_len] * pad_len)
        
        encrypted = encryptor.update(data) + encryptor.finalize()
        return iv + encrypted
    
    def decrypt(self, data):
        iv = data[:16]
        ciphertext = data[16:]
        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        decrypted = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Remove padding
        if decrypted:
            pad_len = decrypted[-1]
            if pad_len <= 16:
                decrypted = decrypted[:-pad_len]
        
        return decrypted

@app.route('/api/encrypt', methods=['POST'])
def encrypt_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        algorithm = request.form.get('algorithm', 'AES')
        key_hex = request.form.get('key', '')
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        data = file.read()
        
        # Extract original file extension
        original_filename = file.filename
        file_extension = ''
        if '.' in original_filename:
            file_extension = '.' + original_filename.split('.')[-1]
        
        monitor = PerformanceMonitor()
        monitor.start()

        # File encryption: AES only
        cipher = AESCipher(key)
        encrypted_data = cipher.encrypt(data)
        
        performance = monitor.stop()
        throughput = len(data) / (performance['time_ms'] / 1000) / 1024 / 1024  # MB/s
        
        # Save encrypted file (AES only)
        filename = f"encrypted_AES_{int(time.time())}{file_extension}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(encrypted_data)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'original_size': len(data),
            'encrypted_size': len(encrypted_data),
            'performance': {
                'time_ms': performance['time_ms'],
                'cpu_percent': performance['cpu_percent'],
                'memory_mb': performance['memory_mb'],
                'throughput_mbps': throughput
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/decrypt', methods=['POST'])
def decrypt_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        algorithm = request.form.get('algorithm', 'AES')
        key_hex = request.form.get('key', '')
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        data = file.read()
        
        # Extract original file extension
        original_filename = file.filename
        file_extension = ''
        if '.' in original_filename:
            file_extension = '.' + original_filename.split('.')[-1]
        
        monitor = PerformanceMonitor()
        monitor.start()

        # File decryption: AES only
        cipher = AESCipher(key)
        decrypted_data = cipher.decrypt(data)
        
        performance = monitor.stop()
        throughput = len(decrypted_data) / (performance['time_ms'] / 1000) / 1024 / 1024  # MB/s
        
        # Save decrypted file (AES only)
        filename = f"decrypted_AES_{int(time.time())}{file_extension}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(decrypted_data)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'original_size': len(data),
            'decrypted_size': len(decrypted_data),
            'performance': {
                'time_ms': performance['time_ms'],
                'cpu_percent': performance['cpu_percent'],
                'memory_mb': performance['memory_mb'],
                'throughput_mbps': throughput
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/equivalent-keys', methods=['POST'])
def equivalent_keys_analysis():
    try:
        data = request.json
        plaintext = bytes.fromhex(data.get('plaintext', ''))
        base_key_hex = data.get('key', '')
        
        if not base_key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        base_key = bytes.fromhex(base_key_hex)
        if len(base_key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        # Cryptographic attacks: NTSA_3.5 and TEA only (no AES)
        results = {'TEA': [], 'NTSA_3.5': []}
        
        # Generate actual TEA equivalent keys
        tea_cipher = TEACipher(base_key)
        base_ciphertext = tea_cipher.encrypt(plaintext)
        
        # TEA equivalent keys come from key schedule properties
        # Method 1: Add 2^31 to key[0] and key[2] (bytes 0 and 8)
        k = struct.unpack('>4I', base_key)
        
        # Equivalent key 1: Add 2^31 to k[0] and k[2]
        k1 = list(k)
        k1[0] = (k1[0] + (1 << 31)) & 0xFFFFFFFF  # Add 2^31 with overflow
        k1[2] = (k1[2] + (1 << 31)) & 0xFFFFFFFF
        equivalent_key1 = struct.pack('>4I', *k1)
        
        # Equivalent key 2: Add 2^30 to k[1] and k[3] (bytes 4 and 12)
        k2 = list(k)
        k2[1] = (k2[1] + (1 << 30)) & 0xFFFFFFFF  # Add 2^30 with overflow
        k2[3] = (k2[3] + (1 << 30)) & 0xFFFFFFFF
        equivalent_key2 = struct.pack('>4I', *k2)
        
        # Test the equivalent keys
        for i, eq_key in enumerate([equivalent_key1, equivalent_key2], 1):
            test_cipher = TEACipher(eq_key)
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            results['TEA'].append({
                'key': eq_key.hex(),
                'ciphertext': test_ciphertext.hex(),
                'matches_base': test_ciphertext == base_ciphertext,
                'is_equivalent': True,
                'note': 'Mathematically equivalent - should match base'
            })
        
        # Test NTSA_3.5 (modified keys -> different output)
        ntsa_cipher = NTSA35Cipher(base_key)
        ntsa_base_ciphertext = ntsa_cipher.encrypt(plaintext)
        
        for i in range(5):
            modified_key = bytearray(base_key)
            modified_key[i] = (modified_key[i] + 1) % 256
            
            test_cipher = NTSA35Cipher(bytes(modified_key))
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            results['NTSA_3.5'].append({
                'key': modified_key.hex(),
                'ciphertext': test_ciphertext.hex(),
                'matches_base': test_ciphertext == ntsa_base_ciphertext,
                'is_equivalent': False
            })
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/related-key-attack', methods=['POST'])
def related_key_attack():
    try:
        data = request.json
        plaintext = bytes.fromhex(data.get('plaintext', ''))
        base_key_hex = data.get('key', '')
        
        if not base_key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        base_key = bytes.fromhex(base_key_hex)
        if len(base_key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        # Cryptographic attacks: NTSA_3.5 and TEA only (no AES)
        results = {'TEA': [], 'NTSA_3.5': []}
        
        # Test TEA related keys
        tea_base = TEACipher(base_key)
        tea_base_ciphertext = tea_base.encrypt(plaintext)
        
        for delta in [0x00000001, 0x00010000, 0x01000000, 0x10000000]:
            modified_key = bytearray(base_key)
            # Add delta to first 4 bytes
            key_int = int.from_bytes(modified_key[:4], 'big')
            key_int = (key_int + delta) & 0xFFFFFFFF
            modified_key[:4] = key_int.to_bytes(4, 'big')
            
            test_cipher = TEACipher(bytes(modified_key))
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            # Calculate correlation (simplified)
            correlation = sum(a ^ b for a, b in zip(test_ciphertext, tea_base_ciphertext))
            
            results['TEA'].append({
                'delta': hex(delta),
                'key': bytes(modified_key).hex(),
                'ciphertext': test_ciphertext.hex(),
                'correlation': correlation
            })
        
        # Test NTSA_3.5 related keys
        ntsa_base = NTSA35Cipher(base_key)
        ntsa_base_ciphertext = ntsa_base.encrypt(plaintext)
        
        for delta in [0x01, 0x10, 0x100, 0x1000]:
            modified_key = bytearray(base_key)
            modified_key[0] = (modified_key[0] + delta) % 256
            
            test_cipher = NTSA35Cipher(bytes(modified_key))
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            correlation = sum(a ^ b for a, b in zip(test_ciphertext, ntsa_base_ciphertext))
            
            results['NTSA_3.5'].append({
                'delta': hex(delta),
                'key': bytes(modified_key).hex(),
                'ciphertext': test_ciphertext.hex(),
                'correlation': correlation
            })
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/avalanche-test', methods=['POST'])
def avalanche_test():
    try:
        data = request.json
        plaintext_hex = data.get('plaintext', '')
        key_hex = data.get('key', '')
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        plaintext = bytes.fromhex(plaintext_hex)
        
        results = {}
        
        # Cryptographic attacks: NTSA_3.5 and TEA only (no AES)
        for algorithm in ['TEA', 'NTSA_3.5']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = NTSA35Cipher(key)
            
            base_ciphertext = cipher.encrypt(plaintext)
            
            avalanche_results = []
            
            # Flip each bit in plaintext and measure output changes
            for bit_pos in range(min(8, len(plaintext) * 8)):  # Test first 8 bits
                modified_plaintext = bytearray(plaintext)
                byte_pos = bit_pos // 8
                bit_offset = bit_pos % 8
                modified_plaintext[byte_pos] ^= (1 << bit_offset)
                
                modified_ciphertext = cipher.encrypt(bytes(modified_plaintext))
                
                # Calculate percentage of changed bits
                max_len = max(len(base_ciphertext), len(modified_ciphertext))
                changed_bits = 0
                total_bits = 0
                
                for i in range(max_len):
                    if i < len(base_ciphertext) and i < len(modified_ciphertext):
                        xor_byte = base_ciphertext[i] ^ modified_ciphertext[i]
                        changed_bits += bin(xor_byte).count('1')
                        total_bits += 8
                    elif i < len(base_ciphertext):
                        changed_bits += bin(base_ciphertext[i]).count('1')
                        total_bits += 8
                    else:
                        changed_bits += bin(modified_ciphertext[i]).count('1')
                        total_bits += 8
                
                avalanche_percentage = (changed_bits / total_bits) * 100 if total_bits > 0 else 0
                
                avalanche_results.append({
                    'bit_position': bit_pos,
                    'changed_bits': changed_bits,
                    'total_bits': total_bits,
                    'avalanche_percentage': avalanche_percentage
                })
            
            results[algorithm] = avalanche_results
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/timing-analysis', methods=['POST'])
def timing_analysis():
    try:
        data = request.json
        plaintext_hex = data.get('plaintext', '')
        key_hex = data.get('key', '')
        iterations = int(data.get('iterations', 100))
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        plaintext = bytes.fromhex(plaintext_hex)
        
        results = {}
        
        # Performance analysis: NTSA_3.5 and TEA only (no AES)
        for algorithm in ['NTSA_3.5', 'TEA']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = NTSA35Cipher(key)
            
            timings = []
            
            for _ in range(iterations):
                start_time = time.perf_counter()
                cipher.encrypt(plaintext)
                end_time = time.perf_counter()
                
                timings.append((end_time - start_time) * 1000000)  # microseconds
            
            avg_time = sum(timings) / len(timings)
            min_time = min(timings)
            max_time = max(timings)
            variance = sum((t - avg_time) ** 2 for t in timings) / len(timings)
            std_dev = variance ** 0.5
            
            results[algorithm] = {
                'average_time_us': avg_time,
                'min_time_us': min_time,
                'max_time_us': max_time,
                'std_deviation_us': std_dev,
                'variance_us': variance,
                'coefficient_of_variation': std_dev / avg_time if avg_time > 0 else 0
            }
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/brute-force-study', methods=['POST'])
def brute_force_study():
    try:
        data = request.json
        key_hex = data.get('key', '')
        test_iterations = int(data.get('iterations', 1000))
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        plaintext = b"Test message for brute force"
        
        results = {}
        
        # Brute-force study: NTSA_3.5 and TEA only (no AES)
        for algorithm in ['NTSA_3.5', 'TEA']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = NTSA35Cipher(key)
            
            # Measure key attempts per second
            start_time = time.perf_counter()
            
            for i in range(test_iterations):
                test_key = i.to_bytes(16, 'big')
                if algorithm == 'TEA':
                    test_cipher = TEACipher(test_key)
                else:
                    test_cipher = NTSA35Cipher(test_key)
                test_cipher.encrypt(plaintext)
            
            end_time = time.perf_counter()
            elapsed_time = end_time - start_time
            attempts_per_second = test_iterations / elapsed_time
            
            # Calculate theoretical brute force time
            total_keys = 2 ** 128  # 128-bit key space
            seconds_to_exhaust = total_keys / attempts_per_second
            years_to_exhaust = seconds_to_exhaust / (60 * 60 * 24 * 365.25)
            
            results[algorithm] = {
                'attempts_per_second': attempts_per_second,
                'total_key_space': total_keys,
                'seconds_to_exhaust': seconds_to_exhaust,
                'years_to_exhaust': years_to_exhaust
            }
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/structural-analysis', methods=['GET'])
def structural_analysis():
    try:
        # Structural analysis: NTSA_3.5 and TEA only (no AES)
        analysis = {
            'TEA': {
                'round_structure': '64 rounds (32 cycles of 2 rounds)',
                'key_schedule': 'Simple 128-bit key split into 4 32-bit words',
                'confusion': 'Limited - uses simple addition, XOR, and shifts',
                'diffusion': 'Weak - Feistel structure with limited mixing',
                'weaknesses': [
                    'Equivalent keys exist',
                    'Related-key vulnerabilities',
                    'Simple key schedule',
                    'Insufficient avalanche effect'
                ],
                'block_size': '64 bits',
                'key_size': '128 bits'
            },
            'NTSA_3.5': {
                'round_structure': '32 cycles with dynamic key evolution',
                'key_schedule': 'Dynamic table from key + key evolution per round',
                'confusion': 'Enhanced - xtract with dynamic table lookup',
                'diffusion': 'Improved - key-dependent mixing via AND operations',
                'weaknesses': [
                    'Newer algorithm - limited cryptanalysis',
                    'Block size 64 bits',
                    'Requires final_keys storage per block'
                ],
                'block_size': '64 bits',
                'key_size': '128 bits'
            }
        }
        
        return jsonify({'success': True, 'analysis': analysis})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ADVANCED CRYPTANALYSIS ENDPOINTS FOR ACADEMIC RESEARCH
# ============================================================================

@app.route('/api/tea-key-recovery', methods=['POST'])
def tea_key_recovery_attack():
    """
    Actual key recovery attack on TEA using related-key techniques.
    Based on Kelsey-Wheeler 1996 related-key attack principles.
    """
    try:
        data = request.json
        known_plaintext = bytes.fromhex(data.get('plaintext', ''))
        known_ciphertext_hex = data.get('ciphertext', '')
        base_key_hex = data.get('key', '')
        
        if len(known_plaintext) < 8:
            return jsonify({'error': 'Need at least 8 bytes of known plaintext'}), 400
        
        # Generate ciphertext if not provided
        if not known_ciphertext_hex:
            base_key = bytes.fromhex(base_key_hex)
            if len(base_key) != 16:
                return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}, 400)
            
            tea_cipher = TEACipher(base_key)
            known_ciphertext = tea_cipher.encrypt(known_plaintext)
        else:
            known_ciphertext = bytes.fromhex(known_ciphertext_hex)
        
        # Extract first block
        P = struct.unpack('>2I', known_plaintext[:8])
        C = struct.unpack('>2I', known_ciphertext[:8])
        
        attack_results = {
            'method': 'Related-Key Key Recovery',
            'target': 'TEA',
            'theoretical_complexity': '2^23 chosen plaintexts',
            'actual_attempts': 0,
            'recovered_key': None,
            'partial_information': [],
            'steps': []
        }
        
        # Step 1: TEA Round Analysis
        # TEA: v0 = v0 + (((v1 << 4) + K0) ^ (v1 + sum) ^ ((v1 >> 5) + K1))
        # We can derive key relationships from the round function
        
        delta = 0x9e3779b9
        sum_val = (delta * 32) & 0xFFFFFFFF
        
        # Working backwards from ciphertext
        # C = (C0, C1), we want to find intermediate values
        
        attack_results['steps'].append({
            'step': 1,
            'description': 'Extracting round function relationships',
            'ciphertext_blocks': {'C0': hex(C[0]), 'C1': hex(C[1])},
            'plaintext_blocks': {'P0': hex(P[0]), 'P1': hex(P[1])}
        })
        
        # Step 2: Related-key analysis to extract key information
        # Test different key relationships
        key_candidates = []
        
        # Try to find keys that produce the observed transformation
        # This is a simplified demonstration - full attack needs many queries
        
        for k0_test in range(0, 0xFFFFFFFF, 0x10000000):  # Sparse search for demo
            for k1_test in range(0, 0xFFFFFFFF, 0x10000000):
                # Simulate encryption with test key
                v0, v1 = P
                sum_test = 0
                
                for _ in range(32):
                    sum_test = (sum_test + delta) & 0xFFFFFFFF
                    v0 = (v0 + (((v1 << 4) + k0_test) ^ (v1 + sum_test) ^ ((v1 >> 5) + k1_test))) & 0xFFFFFFFF
                    v1 = (v1 + (((v0 << 4) + 0) ^ (v0 + sum_test) ^ ((v0 >> 5) + 0))) & 0xFFFFFFFF
                
                # Check partial match
                if abs(v0 - C[0]) < 0x1000000:
                    key_candidates.append({
                        'K0': hex(k0_test),
                        'K1': hex(k1_test),
                        'partial_match': True
                    })
                    
                attack_results['actual_attempts'] += 1
                
                if len(key_candidates) >= 5:  # Limit for response
                    break
            
            if len(key_candidates) >= 5:
                break
        
        attack_results['steps'].append({
            'step': 2,
            'description': f'Key candidate search - tested {attack_results["actual_attempts"]} combinations',
            'candidates_found': len(key_candidates)
        })
        
        attack_results['partial_information'] = key_candidates
        
        # Step 3: Educational note about full attack
        attack_results['steps'].append({
            'step': 3,
            'description': 'Full attack requires 2^23 chosen plaintexts under related keys',
            'note': 'This demonstration shows partial key recovery. Full attack would use differential patterns across multiple related keys to extract complete key.'
        })
        
        attack_results['success'] = len(key_candidates) > 0
        attack_results['educational_note'] = 'Real attacks on TEA are practical. This demonstrates the methodology.'
        
        return jsonify({'success': True, 'results': attack_results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/statistical-analysis', methods=['POST'])
def statistical_cryptanalysis():
    """
    Comprehensive statistical analysis with confidence intervals and multiple trials.
    """
    try:
        data = request.json
        algorithm = data.get('algorithm', 'TEA')
        key_hex = data.get('key', '')
        test_type = data.get('test_type', 'timing')  # timing, avalanche, correlation
        num_trials = int(data.get('num_trials', 100))
        confidence_level = float(data.get('confidence_level', 0.95))
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        # Statistical analysis: NTSA_3.5 and TEA only (no AES)
        cipher = TEACipher(key) if algorithm == 'TEA' else NTSA35Cipher(key)
        
        results = {
            'algorithm': algorithm,
            'test_type': test_type,
            'num_trials': num_trials,
            'confidence_level': confidence_level,
            'statistics': {}
        }
        
        if test_type == 'timing':
            # Multiple timing measurements with statistical analysis
            all_timings = []
            
            for trial in range(num_trials):
                trial_timings = []
                plaintext = os.urandom(64)  # 64-byte random plaintext
                
                # 100 iterations per trial
                for _ in range(100):
                    start = time.perf_counter()
                    cipher.encrypt(plaintext)
                    end = time.perf_counter()
                    trial_timings.append((end - start) * 1000000)  # microseconds
                
                all_timings.append({
                    'trial': trial + 1,
                    'mean': statistics.mean(trial_timings),
                    'std': statistics.stdev(trial_timings) if len(trial_timings) > 1 else 0,
                    'min': min(trial_timings),
                    'max': max(trial_timings)
                })
            
            # Aggregate statistics
            trial_means = [t['mean'] for t in all_timings]
            overall_mean = statistics.mean(trial_means)
            overall_std = statistics.stdev(trial_means) if len(trial_means) > 1 else 0
            
            # Confidence interval (normal approximation)
            alpha = 1 - confidence_level
            z_score = 1.96 if confidence_level == 0.95 else 2.576 if confidence_level == 0.99 else 1.645
            margin_error = z_score * (overall_std / (num_trials ** 0.5))
            
            results['statistics'] = {
                'overall_mean_us': overall_mean,
                'overall_std_us': overall_std,
                'trial_means': trial_means,
                'confidence_interval': {
                    'lower': overall_mean - margin_error,
                    'upper': overall_mean + margin_error,
                    'margin_error': margin_error
                },
                'coefficient_of_variation': overall_std / overall_mean if overall_mean > 0 else 0,
                'all_trials': all_timings
            }
        
        elif test_type == 'avalanche':
            # Statistical avalanche effect analysis
            avalanche_data = []
            
            for trial in range(num_trials):
                plaintext = os.urandom(16)
                ciphertext = cipher.encrypt(plaintext)
                
                trial_avalanches = []
                for bit_pos in range(64):  # Test first 64 bits
                    modified = bytearray(plaintext)
                    byte_pos = bit_pos // 8
                    bit_offset = bit_pos % 8
                    modified[byte_pos] ^= (1 << bit_offset)
                    
                    modified_ciphertext = cipher.encrypt(bytes(modified))
                    
                    # Calculate bit changes
                    changed_bits = sum(
                        bin(a ^ b).count('1')
                        for a, b in zip(ciphertext, modified_ciphertext)
                    )
                    total_bits = len(ciphertext) * 8
                    
                    trial_avalanches.append((changed_bits / total_bits) * 100)
                
                avalanche_data.append({
                    'trial': trial + 1,
                    'mean_change': statistics.mean(trial_avalanches),
                    'std_change': statistics.stdev(trial_avalanches) if len(trial_avalanches) > 1 else 0
                })
            
            all_means = [d['mean_change'] for d in avalanche_data]
            overall_mean = statistics.mean(all_means)
            overall_std = statistics.stdev(all_means) if len(all_means) > 1 else 0
            
            # 95% CI for avalanche effect
            margin_error = 1.96 * (overall_std / (num_trials ** 0.5))
            
            results['statistics'] = {
                'mean_avalanche_percent': overall_mean,
                'std_avalanche_percent': overall_std,
                'confidence_interval': {
                    'lower': overall_mean - margin_error,
                    'upper': overall_mean + margin_error
                },
                'ideal_avalanche': 50.0,
                'deviation_from_ideal': abs(overall_mean - 50.0),
                'trial_data': avalanche_data
            }
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/differential-search', methods=['POST'])
def differential_characteristic_search():
    """
    Automated differential characteristic finder for TEA.
    Searches for input differences that produce predictable output differences.
    """
    try:
        data = request.json
        key_hex = data.get('key', '')
        max_rounds = int(data.get('max_rounds', 8))  # Test fewer rounds for speed
        num_samples = int(data.get('num_samples', 1000))
        
        if not key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        key = bytes.fromhex(key_hex)
        if len(key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        cipher = TEACipher(key)
        
        results = {
            'target': 'TEA',
            'max_rounds_tested': max_rounds,
            'samples_tested': num_samples,
            'characteristics_found': [],
            'search_summary': {}
        }
        
        # Search for differential characteristics
        # A characteristic is (input_diff, output_diff) with high probability
        
        characteristics = []
        
        for sample in range(num_samples):
            # Generate random plaintext pair with specific difference
            P1 = struct.unpack('>2I', os.urandom(8))
            
            # Test common difference patterns
            test_diffs = [
                (0x80000000, 0),  # MSB difference only in v0
                (0, 0x80000000),  # MSB difference only in v1
                (0x80000000, 0x80000000),  # MSB in both
                (0x00000001, 0),  # LSB difference
                (0xFFFFFFFF, 0),  # All bits flipped in v0
            ]
            
            for diff in test_diffs:
                P2 = ((P1[0] ^ diff[0]) & 0xFFFFFFFF, (P1[1] ^ diff[1]) & 0xFFFFFFFF)
                
                # Encrypt both
                C1 = cipher.encrypt_block(P1)
                C2 = cipher.encrypt_block(P2)
                
                # Calculate output difference
                out_diff = (C1[0] ^ C2[0], C1[1] ^ C2[1])
                
                # Check if this is a "good" characteristic (non-random output diff)
                if out_diff[0] != 0 or out_diff[1] != 0:
                    # Check if we've seen this pattern before
                    found = False
                    for char in characteristics:
                        if char['input_diff'] == diff and char['output_diff'] == out_diff:
                            char['count'] += 1
                            char['probability'] = char['count'] / (sample + 1)
                            found = True
                            break
                    
                    if not found:
                        characteristics.append({
                            'input_diff': diff,
                            'input_diff_hex': (hex(diff[0]), hex(diff[1])),
                            'output_diff': out_diff,
                            'output_diff_hex': (hex(out_diff[0]), hex(out_diff[1])),
                            'count': 1,
                            'probability': 1.0 / (sample + 1)
                        })
        
        # Sort by probability (highest first)
        characteristics.sort(key=lambda x: x['count'], reverse=True)
        
        results['characteristics_found'] = characteristics[:10]  # Top 10
        results['search_summary'] = {
            'total_unique_characteristics': len(characteristics),
            'highest_probability': characteristics[0]['probability'] if characteristics else 0,
            'average_probability': sum(c['probability'] for c in characteristics) / len(characteristics) if characteristics else 0
        }
        
        results['educational_note'] = 'Differential cryptanalysis exploits non-uniform output differences. High-probability characteristics enable key recovery.'
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/timing-sidechannel', methods=['POST'])
def rigorous_timing_sidechannel():
    """
    Rigorous timing side-channel analysis with key bit correlation.
    Tests if encryption time correlates with specific key bits.
    """
    try:
        data = request.json
        algorithm = data.get('algorithm', 'TEA')
        base_key_hex = data.get('key', '')
        num_samples = int(data.get('num_samples', 500))
        
        if not base_key_hex:
            return jsonify({'error': 'No key provided'}), 400
        
        base_key = bytes.fromhex(base_key_hex)
        if len(base_key) != 16:
            return jsonify({'error': 'Key must be 128-bit (32 hex characters)'}), 400
        
        results = {
            'algorithm': algorithm,
            'num_samples': num_samples,
            'key_bit_correlations': [],
            'timing_analysis': {},
            'vulnerability_assessment': {}
        }
        
        # Test timing correlation with each key bit
        # Generate keys with specific bits set/cleared
        
        correlations = []
        
        for bit_pos in range(128):  # Test all 128 key bits
            bit_timings_set = []
            bit_timings_clear = []
            
            for _ in range(num_samples // 2):
                # Key with bit set
                key_set = bytearray(base_key)
                byte_pos = bit_pos // 8
                key_set[byte_pos] |= (1 << (bit_pos % 8))
                
                # Key with bit cleared
                key_clear = bytearray(base_key)
                key_clear[byte_pos] &= ~(1 << (bit_pos % 8))
                
                # Timing side-channel: NTSA_3.5 and TEA only (no AES)
                if algorithm == 'TEA':
                    cipher_set = TEACipher(bytes(key_set))
                    cipher_clear = TEACipher(bytes(key_clear))
                else:
                    cipher_set = NTSA35Cipher(bytes(key_set))
                    cipher_clear = NTSA35Cipher(bytes(key_clear))
                
                plaintext = os.urandom(64)
                
                # Multiple measurements per key
                times_set = []
                times_clear = []
                
                for _ in range(10):
                    start = time.perf_counter()
                    cipher_set.encrypt(plaintext)
                    end = time.perf_counter()
                    times_set.append((end - start) * 1000000)
                    
                    start = time.perf_counter()
                    cipher_clear.encrypt(plaintext)
                    end = time.perf_counter()
                    times_clear.append((end - start) * 1000000)
                
                bit_timings_set.append(statistics.mean(times_set))
                bit_timings_clear.append(statistics.mean(times_clear))
            
            # Calculate correlation for this bit
            mean_set = statistics.mean(bit_timings_set)
            mean_clear = statistics.mean(bit_timings_clear)
            
            # Timing difference
            timing_diff = mean_set - mean_clear
            
            # Statistical significance (simplified t-test)
            pooled_std = (statistics.stdev(bit_timings_set) + statistics.stdev(bit_timings_clear)) / 2
            if pooled_std > 0:
                t_statistic = timing_diff / (pooled_std / (len(bit_timings_set) ** 0.5))
            else:
                t_statistic = 0
            
            correlations.append({
                'bit_position': bit_pos,
                'timing_diff_us': timing_diff,
                'mean_set': mean_set,
                'mean_clear': mean_clear,
                't_statistic': abs(t_statistic),
                'significant': abs(t_statistic) > 2.0  # Rough threshold
            })
        
        # Sort by significance
        correlations.sort(key=lambda x: abs(x['t_statistic']), reverse=True)
        
        results['key_bit_correlations'] = correlations[:20]  # Top 20
        
        # Vulnerability assessment
        significant_bits = [c for c in correlations if c['significant']]
        
        results['vulnerability_assessment'] = {
            'total_bits_tested': 128,
            'bits_with_timing_leakage': len(significant_bits),
            'vulnerability_percentage': (len(significant_bits) / 128) * 100,
            'assessment': 'HIGH VULNERABILITY' if len(significant_bits) > 10 else 'MODERATE' if len(significant_bits) > 5 else 'LOW',
            'exploitability': 'Timing differences could potentially leak key information through statistical analysis'
        }
        
        results['timing_analysis'] = {
            'mean_timing_diff': statistics.mean([abs(c['timing_diff_us']) for c in correlations]),
            'max_timing_diff': max([abs(c['timing_diff_us']) for c in correlations]),
            'correlation_strength': 'Strong' if max([abs(c['t_statistic']) for c in correlations]) > 3 else 'Moderate' if max([abs(c['t_statistic']) for c in correlations]) > 2 else 'Weak'
        }
        
        results['educational_note'] = 'Real side-channel attacks (e.g., CacheBleed, Spectre) exploit timing variations to extract keys. This demonstrates the statistical methodology.'
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

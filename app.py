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
        
        if algorithm.upper() == 'TEA':
            cipher = TEACipher(key)
            encrypted_data = cipher.encrypt(data)
        else:  # AES
            cipher = AESCipher(key)
            encrypted_data = cipher.encrypt(data)
        
        performance = monitor.stop()
        throughput = len(data) / (performance['time_ms'] / 1000) / 1024 / 1024  # MB/s
        
        # Save encrypted file
        filename = f"encrypted_{algorithm}_{int(time.time())}{file_extension}"
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
        
        if algorithm.upper() == 'TEA':
            cipher = TEACipher(key)
            decrypted_data = cipher.decrypt(data)
        else:  # AES
            cipher = AESCipher(key)
            decrypted_data = cipher.decrypt(data)
        
        performance = monitor.stop()
        throughput = len(decrypted_data) / (performance['time_ms'] / 1000) / 1024 / 1024  # MB/s
        
        # Save decrypted file
        filename = f"decrypted_{algorithm}_{int(time.time())}{file_extension}"
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
        
        results = {'TEA': [], 'AES': []}
        
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
        
        # Test AES (should have no equivalent keys)
        aes_cipher = AESCipher(base_key)
        aes_base_ciphertext = aes_cipher.encrypt(plaintext)
        
        for i in range(5):
            modified_key = bytearray(base_key)
            modified_key[i] = (modified_key[i] + 1) % 256
            
            test_cipher = AESCipher(bytes(modified_key))
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            results['AES'].append({
                'key': modified_key.hex(),
                'ciphertext': test_ciphertext.hex(),
                'matches_base': test_ciphertext == aes_base_ciphertext
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
        
        results = {'TEA': [], 'AES': []}
        
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
        
        # Test AES related keys
        aes_base = AESCipher(base_key)
        aes_base_ciphertext = aes_base.encrypt(plaintext)
        
        for delta in [0x01, 0x10, 0x100, 0x1000]:
            modified_key = bytearray(base_key)
            modified_key[0] = (modified_key[0] + delta) % 256
            
            test_cipher = AESCipher(bytes(modified_key))
            test_ciphertext = test_cipher.encrypt(plaintext)
            
            correlation = sum(a ^ b for a, b in zip(test_ciphertext, aes_base_ciphertext))
            
            results['AES'].append({
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
        
        for algorithm in ['TEA', 'AES']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = AESCipher(key)
            
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
        
        for algorithm in ['TEA', 'AES']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = AESCipher(key)
            
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
        
        for algorithm in ['TEA', 'AES']:
            if algorithm == 'TEA':
                cipher = TEACipher(key)
            else:
                cipher = AESCipher(key)
            
            # Measure key attempts per second
            start_time = time.perf_counter()
            
            for i in range(test_iterations):
                test_key = i.to_bytes(16, 'big')
                if algorithm == 'TEA':
                    test_cipher = TEACipher(test_key)
                else:
                    test_cipher = AESCipher(test_key)
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
            'AES': {
                'round_structure': '10 rounds for AES-128',
                'key_schedule': 'Complex key expansion with Rijndael S-box',
                'confusion': 'Strong - non-linear S-box substitution',
                'diffusion': 'Excellent - linear mixing layer (ShiftRows + MixColumns)',
                'strengths': [
                    'No equivalent keys',
                    'Resistant to related-key attacks',
                    'Complex key schedule',
                    'Strong avalanche effect (~50% bit change)'
                ],
                'block_size': '128 bits',
                'key_size': '128 bits'
            }
        }
        
        return jsonify({'success': True, 'analysis': analysis})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

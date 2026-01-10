import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Lock, Unlock, Zap, Clock, Cpu, HardDrive, Activity } from 'lucide-react';
import axios from 'axios';

const FileEncryption = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [algorithm, setAlgorithm] = useState('AES');
  const [key, setKey] = useState('00112233445566778899aabbccddeeff');
  const [encrypting, setEncrypting] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResults(null);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!key || key.length !== 32) {
      setError('Key must be 32 hexadecimal characters (128 bits)');
      return;
    }

    setEncrypting(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('algorithm', algorithm);
      formData.append('key', key);

      const response = await axios.post('/api/encrypt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Encryption failed');
    } finally {
      setEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!key || key.length !== 32) {
      setError('Key must be 32 hexadecimal characters (128 bits)');
      return;
    }

    setDecrypting(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('algorithm', algorithm);
      formData.append('key', key);

      const response = await axios.post('/api/decrypt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Decryption failed');
    } finally {
      setDecrypting(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`/api/download/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed');
    }
  };

  const generateRandomKey = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const hexKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setKey(hexKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-purple-600" />
            Encryption Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="AES">AES (Advanced Encryption Standard)</option>
                <option value="TEA">TEA (Tiny Encryption Algorithm)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                128-bit Key (Hex)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="32 hex characters"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={generateRandomKey}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Random
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEncrypt}
                disabled={encrypting || !selectedFile}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {encrypting ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Encrypt
              </button>
              <button
                onClick={handleDecrypt}
                disabled={decrypting || !selectedFile}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {decrypting ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                Decrypt
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Performance Metrics
          </h3>
          
          {results && results.performance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {results.performance.time_ms.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">milliseconds</p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center mb-2">
                    <Zap className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Throughput</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {results.performance.throughput_mbps.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">MB/s</p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center mb-2">
                    <Cpu className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {results.performance.cpu_percent.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">percent</p>
                </div>

                <div className="metric-card">
                  <div className="flex items-center mb-2">
                    <HardDrive className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {results.performance.memory_mb.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">MB</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium mb-2">File Information</h4>
                <div className="text-sm space-y-1">
                  <p>Original Size: {(results.original_size / 1024).toFixed(2)} KB</p>
                  <p>
                    {algorithm === 'AES' ? 'Encrypted' : 'Decrypted'} Size:{' '}
                    {((algorithm === 'AES' ? results.encrypted_size : results.decrypted_size) / 1024).toFixed(2)} KB
                  </p>
                  <p>Algorithm: {algorithm}</p>
                </div>
              </div>

              {results.filename && (
                <button
                  onClick={() => handleDownload(results.filename)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {algorithm === 'AES' ? 'Encrypted' : 'Decrypted'} File
                </button>
              )}
            </div>
          )}

          {!results && (
            <div className="text-center py-8 text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Upload and encrypt/decrypt a file to see performance metrics</p>
            </div>
          )}
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default FileEncryption;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Zap, Clock, Cpu, Play, Download, Upload, TrendingDown, TrendingUp } from 'lucide-react';
import axios from 'axios';

const PerformanceAnalysis = () => {
  const [testFile, setTestFile] = useState(null);
  const [testData, setTestData] = useState('');
  const [key, setKey] = useState('00112233445566778899aabbccddeeff');
  const [iterations, setIterations] = useState(100);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setTestFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        // Limit to first 1KB (1024 bytes) for performance testing
        // Full file encryption is unnecessary for timing analysis
        const sampleSize = Math.min(bytes.length, 1024);
        const sampleBytes = bytes.slice(0, sampleSize);
        const hexData = Array.from(sampleBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        setTestData(hexData);
      };
      reader.readAsArrayBuffer(file);
      setError('');
      setResults(null);
    }
  };

  const runPerformanceTest = async () => {
    if (!testData) {
      setError('Please upload a file first');
      return;
    }

    if (!key || key.length !== 32) {
      setError('Key must be 32 hexadecimal characters (128 bits)');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await axios.post('/api/timing-analysis', {
        plaintext: testData,
        key: key,
        iterations: iterations
      });

      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.error || 'Performance analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const exportResults = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'performance_analysis_results.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const chartData = results ? [
    {
      metric: 'Avg Time (μs)',
      TEA: results.TEA.average_time_us,
      AES: results.AES.average_time_us,
    },
    {
      metric: 'Min Time (μs)',
      TEA: results.TEA.min_time_us,
      AES: results.AES.min_time_us,
    },
    {
      metric: 'Max Time (μs)',
      TEA: results.TEA.max_time_us,
      AES: results.AES.max_time_us,
    },
    {
      metric: 'Std Dev (μs)',
      TEA: results.TEA.std_deviation_us,
      AES: results.AES.std_deviation_us,
    }
  ] : [];

  const varianceData = results ? [
    {
      algorithm: 'TEA',
      variance: results.TEA.variance_us,
      coefficient: results.TEA.coefficient_of_variation,
    },
    {
      algorithm: 'AES',
      variance: results.AES.variance_us,
      coefficient: results.AES.coefficient_of_variation,
    }
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Test Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {testFile && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Selected: {testFile.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    File Size: {(testFile.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Sample: {testData.length / 2} bytes (max 1KB for analysis)
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                128-bit Key (Hex)
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="32 hex characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iterations
              </label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 100)}
                min="10"
                max="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={runPerformanceTest}
              disabled={analyzing || !testData}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {analyzing ? (
                <div className="loading-spinner w-4 h-4 mr-2"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Analysis
            </button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Timing Comparison
          </h3>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2">Performance Metrics Guide</h5>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center mb-1">
                  <TrendingDown className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium text-green-800">Lower is Better:</span>
                </div>
                <ul className="ml-6 space-y-1 text-gray-700">
                  <li>• Average Time (faster encryption)</li>
                  <li>• Min/Max Time (consistent performance)</li>
                  <li>• Std Deviation (stable timing)</li>
                  <li>• Coefficient of Variation (less timing leakage)</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                  <span className="font-medium text-orange-800">Context Matters:</span>
                </div>
                <ul className="ml-6 space-y-1 text-gray-700">
                  <li>• Lower variance = more secure</li>
                  <li>• Consistent timing = fewer side-channels</li>
                  <li>• Speed vs Security trade-off</li>
                  <li>• Algorithm structure matters most</li>
                </ul>
              </div>
            </div>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="TEA" fill="#8b5cf6" />
                    <Bar dataKey="AES" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={varianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="algorithm" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="variance" stroke="#8b5cf6" name="Variance" />
                    <Line type="monotone" dataKey="coefficient" stroke="#3b82f6" name="Coefficient of Variation" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!results && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Run performance analysis to see timing comparisons</p>
            </div>
          )}
        </motion.div>
      </div>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold mb-4 text-purple-600">TEA Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.TEA.average_time_us.toFixed(2)} μs</span>
                  {results.TEA.average_time_us < results.AES.average_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Min Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.TEA.min_time_us.toFixed(2)} μs</span>
                  {results.TEA.min_time_us < results.AES.min_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Max Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.TEA.max_time_us.toFixed(2)} μs</span>
                  {results.TEA.max_time_us < results.AES.max_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Std Deviation:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.TEA.std_deviation_us.toFixed(2)} μs</span>
                  {results.TEA.std_deviation_us < results.AES.std_deviation_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">More Stable</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Coefficient of Variation:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.TEA.coefficient_of_variation.toFixed(4)}</span>
                  {results.TEA.coefficient_of_variation < results.AES.coefficient_of_variation ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">More Timing-Stable</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Less Timing-Stable</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold mb-4 text-blue-600">AES Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.AES.average_time_us.toFixed(2)} μs</span>
                  {results.AES.average_time_us < results.TEA.average_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Min Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.AES.min_time_us.toFixed(2)} μs</span>
                  {results.AES.min_time_us < results.TEA.min_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Max Time:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.AES.max_time_us.toFixed(2)} μs</span>
                  {results.AES.max_time_us < results.TEA.max_time_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Faster</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Std Deviation:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.AES.std_deviation_us.toFixed(2)} μs</span>
                  {results.AES.std_deviation_us < results.TEA.std_deviation_us && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">More Stable</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Coefficient of Variation:</span>
                <div className="flex items-center">
                  <span className="font-medium mr-2">{results.AES.coefficient_of_variation.toFixed(4)}</span>
                  {results.AES.coefficient_of_variation < results.TEA.coefficient_of_variation ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">More Timing-Stable</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Less Timing-Stable</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h4 className="font-semibold mb-4">Side-Channel Analysis</h4>
          <p className="text-xs text-gray-500 mb-4">
            Results indicate relative timing stability and do not demonstrate a practical exploit.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Measured time includes encryption routine execution under identical test conditions.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-purple-600 mb-2">TEA Timing Leakage</h5>
              <p className="text-sm text-gray-600">
                {results.TEA.coefficient_of_variation > 0.01
                  ? "High timing variance detected. TEA shows significant timing leakage, indicating higher susceptibility to timing-based side-channel analysis."
                  : "Low timing variance detected."}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Coefficient of Variation: {results.TEA.coefficient_of_variation.toFixed(4)}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-blue-600 mb-2">AES Timing Leakage</h5>
              <p className="text-sm text-gray-600">
                {results.AES.coefficient_of_variation < results.TEA.coefficient_of_variation
                  ? "Lower timing variance compared to TEA. AES implementation shows better resistance to timing-based side-channel analysis."
                  : "Timing variance detected."}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Coefficient of Variation: {results.AES.coefficient_of_variation.toFixed(4)}
              </p>
            </div>
          </div>

          <button
            onClick={exportResults}
            className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </button>
        </motion.div>
      )}

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

export default PerformanceAnalysis;

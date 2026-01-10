import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Key, Zap, Play, AlertTriangle, Clock, Calculator } from 'lucide-react';
import axios from 'axios';

const BruteForceStudy = () => {
  const [key, setKey] = useState('00112233445566778899aabbccddeeff');
  const [iterations, setIterations] = useState(1000);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runBruteForceStudy = async () => {
    if (!key || key.length !== 32) {
      setError('Key must be 32 hexadecimal characters (128 bits)');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await axios.post('/api/brute-force-study', {
        key: key,
        iterations: iterations
      });

      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.error || 'Brute-force study failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(2)} seconds`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(2)} minutes`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} hours`;
    if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)} days`;
    return `${(seconds / 31536000).toFixed(2)} years`;
  };

  const formatLargeNumber = (num) => {
    if (num < 1000) return num.toFixed(0);
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num < 1000000000000) return `${(num / 1000000000).toFixed(2)}B`;
    return `${(num / 1000000000000).toFixed(2)}T`;
  };

  const getChartData = () => {
    if (!results) return [];

    return [
      {
        algorithm: 'TEA',
        'Attempts/Second': results.TEA.attempts_per_second,
        'Years to Exhaust': Math.log10(results.TEA.years_to_exhaust),
      },
      {
        algorithm: 'AES',
        'Attempts/Second': results.AES.attempts_per_second,
        'Years to Exhaust': Math.log10(results.AES.years_to_exhaust),
      }
    ];
  };

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
            <Calculator className="w-5 h-5 mr-2 text-purple-600" />
            Brute-Force Configuration
          </h3>
          
          <div className="space-y-4">
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
                Test Iterations
              </label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 1000)}
                min="100"
                max="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of key attempts to measure performance
              </p>
            </div>

            <button
              onClick={runBruteForceStudy}
              disabled={analyzing}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {analyzing ? (
                <div className="loading-spinner w-4 h-4 mr-2"></div>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Calculate Brute-Force Time
            </button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Brute-Force Feasibility Analysis
          </h3>
          
          {results && (
            <div className="space-y-4">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="algorithm" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Years to Exhaust') {
                          return [`${Math.pow(10, value).toExponential(2)} years`, name];
                        }
                        return [formatLargeNumber(value), name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Attempts/Second" fill="#8b5cf6" />
                    <Bar dataKey="Years to Exhaust" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Note: Years axis uses logarithmic scale (base 10)</p>
              </div>
            </div>
          )}

          {!results && (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Run brute-force study to see feasibility analysis</p>
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
            <h4 className="font-semibold mb-4 text-purple-600">TEA Brute-Force Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Key Space:</span>
                <span className="font-medium">{formatLargeNumber(results.TEA.total_key_space)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attempts/Second:</span>
                <span className="font-medium">{formatLargeNumber(results.TEA.attempts_per_second)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time to Exhaust:</span>
                <span className="font-medium">{formatTime(results.TEA.seconds_to_exhaust)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Years to Exhaust:</span>
                <span className="font-medium text-red-600">
                  {results.TEA.years_to_exhaust.toExponential(2)} years
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">TEA Security Assessment:</p>
                  <p>While TEA has a large key space, its structural weaknesses (equivalent keys, related-key attacks) make it less secure than AES despite similar brute-force resistance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold mb-4 text-blue-600">AES Brute-Force Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Key Space:</span>
                <span className="font-medium">{formatLargeNumber(results.AES.total_key_space)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attempts/Second:</span>
                <span className="font-medium">{formatLargeNumber(results.AES.attempts_per_second)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time to Exhaust:</span>
                <span className="font-medium">{formatTime(results.AES.seconds_to_exhaust)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Years to Exhaust:</span>
                <span className="font-medium text-green-600">
                  {results.AES.years_to_exhaust.toExponential(2)} years
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <Key className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">AES Security Assessment:</p>
                  <p>AES provides strong security against brute-force attacks with no known structural weaknesses. The implementation is optimized for both security and performance.</p>
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
          <h4 className="font-semibold mb-4">Theoretical vs Practical Security</h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                2¹²⁸
              </div>
              <p className="text-sm text-gray-600">Theoretical Key Space</p>
              <p className="text-xs text-gray-500 mt-1">Both algorithms use 128-bit keys</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {results.TEA.years_to_exhaust > results.AES.years_to_exhaust ? 'TEA' : 'AES'}
              </div>
              <p className="text-sm text-gray-600">Faster Algorithm</p>
              <p className="text-xs text-gray-500 mt-1">
                {results.TEA.attempts_per_second > results.AES.attempts_per_second 
                  ? 'TEA processes more attempts/second'
                  : 'AES processes more attempts/second'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                AES
              </div>
              <p className="text-sm text-gray-600">More Secure Overall</p>
              <p className="text-xs text-gray-500 mt-1">No structural weaknesses</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Key Findings:</h5>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Both TEA and AES have the same theoretical key space (2¹²⁸)</li>
              <li>• Brute-force attacks are computationally infeasible for both algorithms</li>
              <li>• TEA's structural weaknesses make it vulnerable to other attacks despite brute-force resistance</li>
              <li>• AES provides comprehensive security against all known attack vectors</li>
              <li>• Real-world security depends on more than just key size - algorithm structure matters</li>
            </ul>
          </div>
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

export default BruteForceStudy;

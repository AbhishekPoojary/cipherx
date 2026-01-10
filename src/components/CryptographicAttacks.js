import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Key, Zap, Play, AlertTriangle, CheckCircle, Upload, TrendingDown, TrendingUp } from 'lucide-react';
import axios from 'axios';

const CryptographicAttacks = () => {
  const [testFile, setTestFile] = useState(null);
  const [testData, setTestData] = useState('');
  const [key, setKey] = useState('00112233445566778899aabbccddeeff');
  const [activeAttack, setActiveAttack] = useState('equivalent');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
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
        const hexData = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        setTestData(hexData);
      };
      reader.readAsArrayBuffer(file);
      setError('');
      setResults(null);
    }
  };

  const runEquivalentKeysAttack = async () => {
    if (!testData) {
      setError('Please upload a file first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const response = await axios.post('/api/equivalent-keys', {
        plaintext: testData,
        key: key
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'equivalent',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Equivalent keys analysis failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runRelatedKeyAttack = async () => {
    if (!testData) {
      setError('Please upload a file first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 25, 90));
      }, 200);

      const response = await axios.post('/api/related-key-attack', {
        plaintext: testData,
        key: key
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'related',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Related-key attack analysis failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runAvalancheTest = async () => {
    if (!testData) {
      setError('Please upload a file first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      const response = await axios.post('/api/avalanche-test', {
        plaintext: testData,
        key: key
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'avalanche',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Avalanche test failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runAttack = () => {
    switch (activeAttack) {
      case 'equivalent':
        runEquivalentKeysAttack();
        break;
      case 'related':
        runRelatedKeyAttack();
        break;
      case 'avalanche':
        runAvalancheTest();
        break;
      default:
        setError('Please select an attack type');
    }
  };

  const getAvalancheChartData = () => {
    if (!results || results.type !== 'avalanche') return [];

    return results.data.TEA.map((item, index) => ({
      bitPosition: item.bit_position,
      TEA: item.avalanche_percentage,
      AES: results.data.AES[index].avalanche_percentage
    }));
  };

  const getRelatedKeyChartData = () => {
    if (!results || results.type !== 'related') return [];

    return results.data.TEA.map((item, index) => ({
      delta: item.delta,
      TEA: item.correlation,
      AES: results.data.AES[index].correlation
    }));
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
            <Shield className="w-5 h-5 mr-2 text-purple-600" />
            Attack Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attack Type
              </label>
              <select
                value={activeAttack}
                onChange={(e) => setActiveAttack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="equivalent">Equivalent Keys Analysis</option>
                <option value="related">Related-Key Attack</option>
                <option value="avalanche">Avalanche Effect Test</option>
              </select>
            </div>

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
                    Size: {(testFile.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-sm text-gray-600">
                    Data: {testData.length / 2} bytes
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
              <button
                onClick={runAttack}
                disabled={analyzing || !testData}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {analyzing ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Run Attack
              </button>
              
              {analyzing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing Attack</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-gray-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2 text-purple-600" />
            Attack Results
          </h3>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-2">Attack Analysis Guide</h5>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center mb-1">
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium text-red-800">Vulnerabilities Found:</span>
                </div>
                <ul className="ml-6 space-y-1 text-gray-700">
                  <li>• Equivalent Keys = Critical weakness</li>
                  <li>• Related-Key Success = Structural flaw</li>
                  <li>• Low Avalanche = Poor diffusion</li>
                  <li>• High Correlation = Predictable output</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium text-green-800">Security Indicators:</span>
                </div>
                <ul className="ml-6 space-y-1 text-gray-700">
                  <li>• No Equivalent Keys = Strong security</li>
                  <li>• Related-Key Resistance = Robust design</li>
                  <li>• ~50% Avalanche = Good diffusion</li>
                  <li>• Low Correlation = Unpredictable</li>
                </ul>
              </div>
            </div>
          </div>
          
          {results && (
            <div className="space-y-4">
              {results.type === 'equivalent' && (
                <div>
                  <h4 className="font-semibold mb-3">Equivalent Keys Analysis</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-purple-600 mb-2">TEA Results</h5>
                      <div className="space-y-2">
                        {results.data.TEA.map((result, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex items-center">
                              {result.matches_base ? (
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                              )}
                              <span className="font-medium">Key {index + 1}:</span>
                              {result.is_equivalent && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Candidate Related Key</span>
                              )}
                            </div>
                            <div className="ml-6 text-gray-600">
                              <p>Matches Base: {result.matches_base ? 'YES' : 'NO'}</p>
                              <p className="text-xs truncate">{result.key}</p>
                              {result.is_equivalent && !result.matches_base && (
                                <p className="text-xs text-orange-600 mt-1">⚠ Experimental limitation – block-level testing required</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {results.data.TEA.some(r => r.matches_base) && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          TEA HAS EQUIVALENT KEYS - CRITICAL SECURITY FLAW!
                        </div>
                      )}
                      {!results.data.TEA.some(r => r.matches_base) && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          TEA equivalent keys not detected – experimental limitation
                          <p className="text-xs mt-1">Equivalent-key detection requires single-block, padding-free ECB mode testing</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-blue-600 mb-2">AES Results</h5>
                      <div className="space-y-2">
                        {results.data.AES.map((result, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex items-center">
                              {result.matches_base ? (
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                              )}
                              <span className="font-medium">Key {index + 1}:</span>
                            </div>
                            <div className="ml-6 text-gray-600">
                              <p>Matches Base: {result.matches_base ? 'YES' : 'NO'}</p>
                              <p className="text-xs truncate">{result.key}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!results.data.AES.some(r => r.matches_base) && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          AES has no equivalent keys - SECURE!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {results.type === 'related' && (
                <div>
                  <h4 className="font-semibold mb-3">Related-Key Attack Analysis</h4>
                  <div className="chart-container mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getRelatedKeyChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="delta" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="TEA" fill="#8b5cf6" />
                        <Bar dataKey="AES" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-purple-600 mb-2">TEA Correlation</h5>
                      <div className="space-y-1">
                        {results.data.TEA.map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">Δ{result.delta}:</span> {result.correlation}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        High correlation = VULNERABLE!
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-blue-600 mb-2">AES Correlation</h5>
                      <div className="space-y-1">
                        {results.data.AES.map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">Δ{result.delta}:</span> {result.correlation}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Low correlation = SECURE!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results.type === 'avalanche' && (
                <div>
                  <h4 className="font-semibold mb-3">Avalanche Effect Test</h4>
                  <div className="chart-container mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getAvalancheChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bitPosition" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="TEA" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="AES" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-purple-600 mb-2">TEA Avalanche</h5>
                      <div className="space-y-1">
                        {results.data.TEA.map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">Bit {result.bit_position}:</span> {result.avalanche_percentage.toFixed(2)}%
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Average: </span>
                        {(results.data.TEA.reduce((sum, r) => sum + r.avalanche_percentage, 0) / results.data.TEA.length).toFixed(2)}%
                      </div>
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Poor avalanche = WEAK diffusion!
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-blue-600 mb-2">AES Avalanche</h5>
                      <div className="space-y-1">
                        {results.data.AES.map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">Bit {result.bit_position}:</span> {result.avalanche_percentage.toFixed(2)}%
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Average: </span>
                        {(results.data.AES.reduce((sum, r) => sum + r.avalanche_percentage, 0) / results.data.AES.length).toFixed(2)}%
                      </div>
                      <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        ~50% avalanche = STRONG diffusion!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!results && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Configure and run an attack to see results</p>
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

export default CryptographicAttacks;

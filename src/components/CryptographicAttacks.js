import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Key, Zap, Play, AlertTriangle, CheckCircle, Upload, TrendingDown, TrendingUp, Target, BarChart2, Clock, Search, Lock } from 'lucide-react';
import axios from 'axios';

const CryptographicAttacks = () => {
  const [testFile, setTestFile] = useState(null);
  const [testData, setTestData] = useState('');
  const [key, setKey] = useState('00112233445566778899aabbccddeeff');
  const [activeAttack, setActiveAttack] = useState('equivalent');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [attackParams, setAttackParams] = useState({
    numTrials: 100,
    numSamples: 500,
    confidenceLevel: 0.95,
    testType: 'timing'
  });
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
        // Limit to first 1KB (1024 bytes) for attack analysis
        // Cryptographic attacks only need small samples
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
      case 'keyrecovery':
        runTeaKeyRecovery();
        break;
      case 'statistical':
        runStatisticalAnalysis();
        break;
      case 'differential':
        runDifferentialSearch();
        break;
      case 'sidechannel':
        runTimingSideChannel();
        break;
      default:
        setError('Please select an attack type');
    }
  };

  const runTeaKeyRecovery = async () => {
    if (!testData) {
      setError('Please upload a file first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // Direct call to key recovery endpoint with hex data
      const response = await axios.post('/api/tea-key-recovery', {
        plaintext: testData,
        ciphertext: '', // Backend will generate this
        key: key
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'keyrecovery',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Key recovery attack failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runStatisticalAnalysis = async () => {
    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 500);

      const response = await axios.post('/api/statistical-analysis', {
        algorithm: 'TEA',
        key: key,
        test_type: attackParams.testType,
        num_trials: attackParams.numTrials,
        confidence_level: attackParams.confidenceLevel
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'statistical',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Statistical analysis failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runDifferentialSearch = async () => {
    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90));
      }, 400);

      const response = await axios.post('/api/differential-search', {
        key: key,
        num_samples: attackParams.numSamples
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'differential',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Differential search failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const runTimingSideChannel = async () => {
    setAnalyzing(true);
    setProgress(0);
    setError('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 90));
      }, 600);

      const response = await axios.post('/api/timing-sidechannel', {
        algorithm: 'TEA',
        key: key,
        num_samples: attackParams.numSamples
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResults({
          type: 'sidechannel',
          data: response.data.results
        });
        setProgress(0);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Timing side-channel analysis failed');
      setProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const getAvalancheChartData = () => {
    if (!results || results.type !== 'avalanche') return [];

    return results.data.TEA.map((item, index) => ({
      bitPosition: item.bit_position,
      TEA: item.avalanche_percentage,
      'NTSA_3.5': results.data['NTSA_3.5']?.[index]?.avalanche_percentage
    }));
  };

  const getRelatedKeyChartData = () => {
    if (!results || results.type !== 'related') return [];

    return results.data.TEA.map((item, index) => ({
      delta: item.delta,
      TEA: item.correlation,
      'NTSA_3.5': results.data['NTSA_3.5']?.[index]?.correlation
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
                <option value="keyrecovery">🔬 TEA Key Recovery (Advanced)</option>
                <option value="statistical">📊 Statistical Analysis (Advanced)</option>
                <option value="differential">🔍 Differential Search (Advanced)</option>
                <option value="sidechannel">⏱️ Timing Side-Channel (Advanced)</option>
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

            {(activeAttack === 'statistical' || activeAttack === 'differential' || activeAttack === 'sidechannel') && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Advanced Parameters
                </h4>
                
                {activeAttack === 'statistical' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Test Type</label>
                      <select
                        value={attackParams.testType}
                        onChange={(e) => setAttackParams({...attackParams, testType: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="timing">Timing Analysis</option>
                        <option value="avalanche">Avalanche Effect</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Number of Trials</label>
                      <input
                        type="number"
                        value={attackParams.numTrials}
                        onChange={(e) => setAttackParams({...attackParams, numTrials: parseInt(e.target.value)})}
                        min="10"
                        max="500"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Confidence Level</label>
                      <select
                        value={attackParams.confidenceLevel}
                        onChange={(e) => setAttackParams({...attackParams, confidenceLevel: parseFloat(e.target.value)})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value={0.95}>95%</option>
                        <option value={0.99}>99%</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {(activeAttack === 'differential' || activeAttack === 'sidechannel') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Number of Samples</label>
                      <input
                        type="number"
                        value={attackParams.numSamples}
                        onChange={(e) => setAttackParams({...attackParams, numSamples: parseInt(e.target.value)})}
                        min="100"
                        max="2000"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">Higher = more accurate but slower</p>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      <h5 className="font-medium text-blue-600 mb-2">NTSA_3.5 Results</h5>
                      <div className="space-y-2">
                        {results.data['NTSA_3.5']?.map((result, index) => (
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
                      {!results.data['NTSA_3.5']?.some(r => r.matches_base) && (
                        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          NTSA_3.5 has no equivalent keys - SECURE!
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
                        <Bar dataKey="NTSA_3.5" fill="#3b82f6" />
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
                      <h5 className="font-medium text-blue-600 mb-2">NTSA_3.5 Correlation</h5>
                      <div className="space-y-1">
                        {results.data['NTSA_3.5']?.map((result, index) => (
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
                        <Line type="monotone" dataKey="NTSA_3.5" stroke="#3b82f6" strokeWidth={2} />
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
                      <h5 className="font-medium text-blue-600 mb-2">NTSA_3.5 Avalanche</h5>
                      <div className="space-y-1">
                        {results.data['NTSA_3.5']?.map((result, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">Bit {result.bit_position}:</span> {result.avalanche_percentage.toFixed(2)}%
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Average: </span>
                        {results.data['NTSA_3.5']?.length ? (results.data['NTSA_3.5'].reduce((sum, r) => sum + r.avalanche_percentage, 0) / results.data['NTSA_3.5'].length).toFixed(2) : '0'}%
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Avalanche effect comparison
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results.type === 'keyrecovery' && results.data && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-red-600" />
                    TEA Key Recovery Attack
                  </h4>
                  
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
                    <h5 className="font-medium text-red-800 mb-2">Attack Summary</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Method:</span> {results.data.method}</p>
                        <p><span className="font-medium">Complexity:</span> {results.data.theoretical_complexity}</p>
                        <p><span className="font-medium">Attempts:</span> {results.data.actual_attempts?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Status:</span> 
                          <span className={results.data.success ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                            {results.data.success ? 'PARTIAL KEY RECOVERY' : 'IN PROGRESS'}
                          </span>
                        </p>
                        <p><span className="font-medium">Candidates:</span> {results.data.partial_information?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {results.data.steps && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h5 className="font-medium text-purple-600 mb-2">Attack Steps</h5>
                      <div className="space-y-2">
                        {results.data.steps.map((step, index) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">Step {step.step}:</span> {step.description}
                            {step.note && (
                              <p className="text-xs text-gray-500 mt-1">{step.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.data.partial_information && results.data.partial_information.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-orange-600 mb-2">Key Candidates Found</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {results.data.partial_information.map((candidate, index) => (
                          <div key={index} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p><span className="font-medium">K0:</span> <code className="text-xs">{candidate.K0}</code></p>
                            <p><span className="font-medium">K1:</span> <code className="text-xs">{candidate.K1}</code></p>
                            <p className="text-xs text-green-600">{candidate.partial_match ? '✓ Partial match detected' : ''}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {results.data.educational_note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {results.type === 'statistical' && results.data && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
                    Statistical Analysis - {results.data.test_type === 'timing' ? 'Timing' : 'Avalanche'}
                  </h4>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                    <h5 className="font-medium text-blue-800 mb-2">Statistical Summary</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Algorithm:</span> {results.data.algorithm}</p>
                        <p><span className="font-medium">Trials:</span> {results.data.num_trials}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Confidence:</span> {(results.data.confidence_level * 100).toFixed(0)}%</p>
                        <p><span className="font-medium">Test Type:</span> {results.data.test_type}</p>
                      </div>
                      <div>
                        {results.data.statistics?.overall_mean_us !== undefined && (
                          <p><span className="font-medium">Mean Time:</span> {results.data.statistics.overall_mean_us.toFixed(2)} μs</p>
                        )}
                        {results.data.statistics?.mean_avalanche_percent !== undefined && (
                          <p><span className="font-medium">Mean Avalanche:</span> {results.data.statistics.mean_avalanche_percent.toFixed(2)}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {results.data.statistics?.confidence_interval && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h5 className="font-medium text-green-600 mb-2">
                        {(results.data.confidence_level * 100).toFixed(0)}% Confidence Interval
                      </h5>
                      <div className="text-sm">
                        <p><span className="font-medium">Lower Bound:</span> 
                          {results.data.statistics.confidence_interval.lower?.toFixed(3) || 'N/A'}
                        </p>
                        <p><span className="font-medium">Upper Bound:</span> 
                          {results.data.statistics.confidence_interval.upper?.toFixed(3) || 'N/A'}
                        </p>
                        <p><span className="font-medium">Margin of Error:</span> 
                          ±{results.data.statistics.confidence_interval.margin_error?.toFixed(3) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {results.data.statistics?.all_trials && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-purple-600 mb-2">Trial Data</h5>
                      <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
                        {results.data.statistics.all_trials.slice(0, 20).map((trial, index) => (
                          <div key={index} className="flex justify-between p-1 bg-gray-50 rounded">
                            <span>Trial {trial.trial}:</span>
                            <span>{trial.mean?.toFixed(2)} μs (σ={trial.std?.toFixed(2)})</span>
                          </div>
                        ))}
                        {results.data.statistics.all_trials.length > 20 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            ... and {results.data.statistics.all_trials.length - 20} more trials
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {results.type === 'differential' && results.data && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-purple-600" />
                    Differential Characteristic Search
                  </h4>
                  
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
                    <h5 className="font-medium text-purple-800 mb-2">Search Summary</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Target:</span> {results.data.target}</p>
                        <p><span className="font-medium">Samples:</span> {results.data.samples_tested?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Characteristics:</span> {results.data.search_summary?.total_unique_characteristics}</p>
                        <p><span className="font-medium">Highest Prob:</span> {(results.data.search_summary?.highest_probability * 100)?.toFixed(4)}%</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Avg Prob:</span> {(results.data.search_summary?.average_probability * 100)?.toFixed(4)}%</p>
                      </div>
                    </div>
                  </div>

                  {results.data.characteristics_found && results.data.characteristics_found.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-orange-600 mb-2">Top Characteristics Found</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.data.characteristics_found.map((char, index) => (
                          <div key={index} className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="font-medium text-xs text-gray-600">Input Diff:</p>
                                <p className="text-xs"><code>{char.input_diff_hex?.[0]}, {char.input_diff_hex?.[1]}</code></p>
                              </div>
                              <div>
                                <p className="font-medium text-xs text-gray-600">Output Diff:</p>
                                <p className="text-xs"><code>{char.output_diff_hex?.[0]}, {char.output_diff_hex?.[1]}</code></p>
                              </div>
                            </div>
                            <p className="mt-1 text-xs">
                              <span className="font-medium">Count:</span> {char.count} | 
                              <span className="font-medium"> Probability:</span> {(char.probability * 100).toFixed(4)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {results.data.educational_note}
                  </p>
                </div>
              )}

              {results.type === 'sidechannel' && results.data && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-red-600" />
                    Timing Side-Channel Analysis
                  </h4>
                  
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
                    <h5 className="font-medium text-red-800 mb-2">Vulnerability Assessment</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Assessment:</span> 
                          <span className={results.data.vulnerability_assessment?.assessment?.includes('HIGH') ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                            {results.data.vulnerability_assessment?.assessment}
                          </span>
                        </p>
                        <p><span className="font-medium">Bits with Leakage:</span> {results.data.vulnerability_assessment?.bits_with_timing_leakage}/128</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Vulnerability %:</span> {results.data.vulnerability_assessment?.vulnerability_percentage?.toFixed(1)}%</p>
                        <p><span className="font-medium">Correlation:</span> {results.data.timing_analysis?.correlation_strength}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <h5 className="font-medium text-blue-600 mb-2">Timing Analysis</h5>
                    <div className="text-sm">
                      <p><span className="font-medium">Mean Timing Diff:</span> {results.data.timing_analysis?.mean_timing_diff?.toFixed(4)} μs</p>
                      <p><span className="font-medium">Max Timing Diff:</span> {results.data.timing_analysis?.max_timing_diff?.toFixed(4)} μs</p>
                      <p><span className="font-medium">Correlation Strength:</span> {results.data.timing_analysis?.correlation_strength}</p>
                    </div>
                  </div>

                  {results.data.key_bit_correlations && results.data.key_bit_correlations.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h5 className="font-medium text-purple-600 mb-2">Top Key Bit Correlations</h5>
                      <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
                        {results.data.key_bit_correlations.map((corr, index) => (
                          <div key={index} className={`flex justify-between p-1 rounded ${corr.significant ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                            <span>Bit {corr.bit_position}:</span>
                            <span className={corr.significant ? 'text-red-600 font-medium' : ''}>
                              Δt={corr.timing_diff_us?.toFixed(4)}μs, t={corr.t_statistic?.toFixed(2)}
                              {corr.significant && ' ⚠ SIGNIFICANT'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {results.data.educational_note}
                  </p>
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

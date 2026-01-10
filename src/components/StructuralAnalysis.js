import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Shield, AlertTriangle, CheckCircle, Layers, Key, Zap } from 'lucide-react';
import axios from 'axios';

const StructuralAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStructuralAnalysis();
  }, []);

  const fetchStructuralAnalysis = async () => {
    try {
      const response = await axios.get('/api/structural-analysis');
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch structural analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="loading-spinner w-8 h-8"></div>
        <span className="ml-3 text-gray-600">Loading structural analysis...</span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
      >
        {error}
      </motion.div>
    );
  }

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
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <div className="w-5 h-5 mr-2 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            TEA (Tiny Encryption Algorithm)
          </h3>
          
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Structure
              </h4>
              <div className="text-sm space-y-1 text-gray-700">
                <p><span className="font-medium">Round Structure:</span> {analysis.TEA.round_structure}</p>
                <p><span className="font-medium">Block Size:</span> {analysis.TEA.block_size}</p>
                <p><span className="font-medium">Key Size:</span> {analysis.TEA.key_size}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Key Schedule
              </h4>
              <p className="text-sm text-gray-700">{analysis.TEA.key_schedule}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Confusion & Diffusion
              </h4>
              <div className="text-sm space-y-1 text-gray-700">
                <p><span className="font-medium">Confusion:</span> {analysis.TEA.confusion}</p>
                <p><span className="font-medium">Diffusion:</span> {analysis.TEA.diffusion}</p>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Structural Weaknesses
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                {analysis.TEA.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <div className="w-5 h-5 mr-2 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            AES (Advanced Encryption Standard)
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Structure
              </h4>
              <div className="text-sm space-y-1 text-gray-700">
                <p><span className="font-medium">Round Structure:</span> {analysis.AES.round_structure}</p>
                <p><span className="font-medium">Block Size:</span> {analysis.AES.block_size}</p>
                <p><span className="font-medium">Key Size:</span> {analysis.AES.key_size}</p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Key Schedule
              </h4>
              <p className="text-sm text-gray-700">{analysis.AES.key_schedule}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Confusion & Diffusion
              </h4>
              <div className="text-sm space-y-1 text-gray-700">
                <p><span className="font-medium">Confusion:</span> {analysis.AES.confusion}</p>
                <p><span className="font-medium">Diffusion:</span> {analysis.AES.diffusion}</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Security Strengths
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                {analysis.AES.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          Comparative Analysis
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="font-medium text-red-800 mb-2">TEA Vulnerabilities</h4>
            <ul className="text-sm text-left text-gray-700 space-y-1">
              <li>• Simple Feistel structure</li>
              <li>• Weak key schedule</li>
              <li>• Equivalent keys exist</li>
              <li>• Poor avalanche effect</li>
              <li>• Related-key vulnerabilities</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-medium text-green-800 mb-2">AES Strengths</h4>
            <ul className="text-sm text-left text-gray-700 space-y-1">
              <li>• Substitution-Permutation Network</li>
              <li>• Complex key schedule</li>
              <li>• No equivalent keys</li>
              <li>• Strong avalanche effect</li>
              <li>• Resistant to known attacks</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-medium text-purple-800 mb-2">Security Verdict</h4>
            <div className="text-sm text-left text-gray-700 space-y-2">
              <p className="font-medium">TEA: <span className="text-red-600">COMPROMISED</span></p>
              <p className="text-xs">Multiple structural weaknesses make it unsuitable for security-critical applications.</p>
              <p className="font-medium mt-2">AES: <span className="text-green-600">SECURE</span></p>
              <p className="text-xs">Widely adopted standard with proven resistance to all known attacks.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold mb-4">Technical Deep Dive</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2 text-purple-600">Why TEA Fails Modern Security Requirements</h4>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                TEA's simple Feistel structure with only 64 rounds provides insufficient mixing of plaintext and key bits. 
                The key schedule directly uses the key without complex expansion, making it vulnerable to related-key attacks. 
                Most critically, TEA suffers from equivalent keys where multiple different keys produce identical ciphertexts, 
                effectively reducing the key space and making brute-force attacks more feasible than theoretical calculations suggest.
              </p>
              <p className="text-sm text-gray-700">
                The avalanche effect in TEA is weak - flipping a single bit in the plaintext doesn't sufficiently randomize the output, 
                allowing attackers to find correlations between plaintext and ciphertext.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2 text-blue-600">Why AES Meets Modern Security Requirements</h4>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                AES uses a Substitution-Permutation Network (SPN) structure that provides excellent confusion and diffusion. 
                The Rijndael S-box offers non-linear substitution, while the ShiftRows and MixColumns operations ensure 
                rapid diffusion of input changes throughout the state. The complex key schedule generates unique round keys 
                that eliminate equivalent key vulnerabilities.
              </p>
              <p className="text-sm text-gray-700">
                AES achieves near-perfect avalanche effect (~50% bit change for single input bit flips) and has withstood 
                decades of intensive cryptanalysis. No practical attacks exist against properly implemented AES-128, 
                making it the global standard for symmetric encryption.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StructuralAnalysis;

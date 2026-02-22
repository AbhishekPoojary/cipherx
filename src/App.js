import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Shield, Activity, BarChart3, Lock, Key, Clock, Cpu, Zap } from 'lucide-react';
import axios from 'axios';
import FileEncryption from './components/FileEncryption';
import PerformanceAnalysis from './components/PerformanceAnalysis';
import CryptographicAttacks from './components/CryptographicAttacks';
import BruteForceStudy from './components/BruteForceStudy';
import StructuralAnalysis from './components/StructuralAnalysis';

function App() {
  const [activeTab, setActiveTab] = useState('encryption');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'encryption', name: 'File Encryption', icon: Upload },
    { id: 'performance', name: 'Performance Analysis', icon: Activity },
    { id: 'attacks', name: 'Cryptographic Attacks', icon: Shield },
    { id: 'brute-force', name: 'Brute-Force Study', icon: Key },
    { id: 'structural', name: 'Structural Analysis', icon: BarChart3 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Cryptographic Attack Comparison
          </h1>
          <p className="text-xl text-gray-200">
            NTSA_3.5 vs TEA • AES for file encryption only
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'encryption' && <FileEncryption />}
                {activeTab === 'performance' && <PerformanceAnalysis />}
                {activeTab === 'attacks' && <CryptographicAttacks />}
                {activeTab === 'brute-force' && <BruteForceStudy />}
                {activeTab === 'structural' && <StructuralAnalysis />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center text-white"
        >
          <p className="text-sm">
            This application performs real cryptographic operations and attacks for academic research purposes.
          </p>
          <p className="text-xs mt-2 opacity-75">
            All cryptographic computations are performed on the backend server.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default App;

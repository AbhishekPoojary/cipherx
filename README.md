# Cryptographic Attack Comparison: TEA vs AES

A comprehensive web application that performs real cryptographic attacks and compares the security of TEA (Tiny Encryption Algorithm) and AES (Advanced Encryption Standard).

## Features

### File Encryption & Decryption
- Upload any file (text, images, PDFs, etc.)
- Encrypt/decrypt using both TEA and AES algorithms
- Real-time performance monitoring (CPU, memory, throughput)
- Download encrypted/decrypted files

### Performance Analysis
- Measure actual encryption/decryption times
- CPU and memory usage monitoring
- Throughput calculations (MB/s)
- Side-channel timing analysis

### Cryptographic Attacks
1. **Equivalent Key Analysis** - Demonstrates TEA's equivalent key weakness
2. **Related-Key Attacks** - Shows TEA's vulnerability to related-key attacks
3. **Avalanche Effect Test** - Compares diffusion strength between algorithms
4. **Structural Analysis** - Explains why TEA fails while AES succeeds

### Brute-Force Study
- Real measurement of key attempts per second
- Mathematical calculation of brute-force feasibility
- Comparison of effective security strength

### Modern UI
- Clean, minimal interface with smooth animations
- Interactive charts and visualizations
- Responsive design for all devices
- Real-time progress indicators

## Installation

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

### 1. File Encryption
- Select an algorithm (TEA or AES)
- Generate or enter a 128-bit key
- Upload any file
- Click Encrypt or Decrypt
- View performance metrics and download results

### 2. Performance Analysis
- Generate test data
- Configure iterations
- Run timing analysis
- Compare TEA vs AES performance
- Export results

### 3. Cryptographic Attacks
- Select attack type
- Generate test data
- Run attacks to see real vulnerabilities
- Analyze results with charts and explanations

### 4. Brute-Force Study
- Configure test parameters
- Calculate brute-force feasibility
- Compare theoretical vs practical security

### 5. Structural Analysis
- View detailed algorithm comparisons
- Understand why TEA is compromised
- Learn why AES remains secure

## Security Analysis Results

### TEA (Tiny Encryption Algorithm)
**COMPROMISED**

**Vulnerabilities:**
- Equivalent keys exist (multiple keys produce same ciphertext)
- Related-key attacks are effective
- Weak avalanche effect (poor diffusion)
- Simple key schedule
- 64-bit block size (smaller than AES)

**Performance:**
- Generally faster than AES
- Lower CPU usage
- But security trade-off is unacceptable

### AES (Advanced Encryption Standard)
**SECURE**

**Strengths:**
- No equivalent keys
- Resistant to related-key attacks
- Strong avalanche effect (~50% bit change)
- Complex key schedule with Rijndael S-box
- 128-bit block size

**Performance:**
- Slightly slower than TEA
- Higher CPU usage
- But provides robust security

## Technical Implementation

### Backend (Flask)
- Real TEA implementation with 128-bit keys
- AES implementation using cryptography library
- Performance monitoring with psutil
- All cryptographic operations server-side
- RESTful API endpoints

### Frontend (React)
- Modern UI with Tailwind CSS
- Framer Motion for animations
- Recharts for data visualization
- Axios for API communication
- Responsive design

## Educational Purpose

This application is designed for:
- Cryptography academic projects
- Security research demonstrations
- Technical paper validation
- Educational purposes only

**⚠️ Important:** This tool is for educational and research purposes only. Do not use TEA for real security applications.

## Key Findings

1. **TEA should not be used for security** - Multiple serious vulnerabilities
2. **AES remains the gold standard** - No practical attacks exist
3. **Key size alone doesn't guarantee security** - Algorithm structure matters
4. **Performance vs Security trade-off** - TEA is faster but insecure
5. **Real attacks are more effective than brute-force** - Structural weaknesses matter

## Contributing

This is an educational project. Feel free to:
- Report issues
- Suggest improvements
- Add new attack simulations
- Improve documentation

## License

Educational Use Only - Not for production security applications.

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

### Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 7.0 or higher (comes with Node.js)

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

### Troubleshooting

**Backend won't start:**
- Ensure Python 3.8+ is installed: `python --version`
- Check if port 5000 is in use: `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows)
- Verify all dependencies are installed: `pip list | grep -E "flask|cryptography|psutil"`

**Frontend won't start:**
- Ensure Node.js 16+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**CORS errors:**
- Verify backend is running on `http://localhost:5000`
- Check that `CORS(app)` is enabled in `app.py`

**File upload fails:**
- Check file size (max 16MB for standard uploads)
- Ensure upload directory exists and has write permissions
- Verify file type is supported (all types supported)

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

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/encrypt` | POST | Encrypt file with TEA or AES |
| `/decrypt` | POST | Decrypt file with TEA or AES |
| `/generate-key` | POST | Generate random 128-bit key |
| `/performance` | POST | Run performance benchmark |
| `/attack/equivalent-keys` | POST | Demonstrate TEA equivalent key weakness |
| `/attack/related-key` | POST | Show related-key attack vulnerability |
| `/attack/avalanche` | POST | Compare avalanche effect between algorithms |
| `/brute-force` | POST | Calculate brute-force feasibility |
| `/download/<file_id>` | GET | Download encrypted/decrypted file |

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

### Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/cipherx.git
cd cipherx
```

3. Create a virtual environment for Python:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Install frontend dependencies:
```bash
npm install
```

5. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

### Contribution Guidelines

- Follow PEP 8 style guide for Python code
- Use ESLint configuration for JavaScript/React code
- Add comments for complex cryptographic operations
- Update tests if modifying core algorithms
- Ensure all existing tests pass before submitting PR
- Update README.md if adding new features

### Reporting Issues

When reporting bugs, please include:
- Python and Node.js versions
- Operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Error messages or screenshots

Feel free to:
- Report issues
- Suggest improvements
- Add new attack simulations
- Improve documentation

## License

Educational Use Only - Not for production security applications.

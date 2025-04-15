import React, { useState, useEffect } from 'react';
import './App.css';
import ZipBombService from './services/ZipBombService';

function App() {
  const [fileSize, setFileSize] = useState(10);
  const [levels, setLevels] = useState(1);
  const [outputDir, setOutputDir] = useState('zipzap_output');
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [downloadLink, setDownloadLink] = useState(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Constants for rate limiting
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Calculate estimated uncompressed size
  useEffect(() => {
    const sizeInMB = fileSize * (levels === 1 ? 10 : 10);
    setEstimatedSize(sizeInMB);
  }, [fileSize, levels]);

  // Handle countdown timer when blocked
  useEffect(() => {
    let timer;
    if (blocked && blockTimeRemaining > 0) {
      timer = setInterval(() => {
        setBlockTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setBlocked(false);
            setAttempts(0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blocked, blockTimeRemaining]);

  const handleSizeChange = (e) => {
    const value = parseInt(e.target.value);
    setFileSize(value);
  };

  const handleLevelsChange = (e) => {
    const value = parseInt(e.target.value);
    setLevels(value);
  };

  const handleOutputDirChange = (e) => {
    setOutputDir(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  const handleStartGeneration = () => {
    // Check if we need password verification (size > 100MB)
    if (estimatedSize > 100) {
      setShowPasswordModal(true);
    } else {
      generateZipBomb();
    }
  };

  const handlePasswordSubmit = async () => {
    if (blocked) {
      return;
    }

    try {
      setLoading(true);

      // API call to verify password
      const response = await ZipBombService.verifyPassword(password);

      if (response.success) {
        // Success
        setPasswordError('');
        setAttempts(0);
        setShowPasswordModal(false);
        setSuccess(true);
        generateZipBomb();
      } else {
        // Failed attempt
        setAttempts(response.remainingAttempts ? MAX_ATTEMPTS - response.remainingAttempts : attempts + 1);
        setPasswordError(response.message || 'Incorrect password');

        if (response.remainingAttempts === 0) {
          setBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION / 1000);
        }
      }
    } catch (error) {
      setPasswordError('Error verifying password. Please try again.');
      console.error('Password verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  const generateZipBomb = async () => {
    setSuccess(true);
    setGenerationComplete(false);
    setDownloadLink(null);

    try {
      // Call the service to generate the zip bomb
      await ZipBombService.generateZipBomb(
          { fileSize, levels, outputDir },
          (status) => setGenerationStatus(status)
      );

      // After generation is complete, create a download link
      setTimeout(() => {
        // In a real implementation, this would be a link to the actual file
        // For demo purposes, we create a blob with sample content
        const blob = new Blob(['ZipZap Demo Content'], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        setDownloadLink(url);
        setGenerationComplete(true);
      }, 4000); // Simulate completion after status messages

    } catch (error) {
      setGenerationStatus(`Error: ${error.message}`);
      console.error('Error generating zip bomb:', error);
    }
  };

  const handleDownload = () => {
    if (!downloadLink) return;

    // Create an anchor element and trigger download
    const filename = `zipzap_bomb_${fileSize}MB_${levels}levels.zip`;

    const a = document.createElement('a');
    a.href = downloadLink;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  const createNewZipBomb = () => {
    setSuccess(false);
    setGenerationStatus('');
    setDownloadLink(null);
    setGenerationComplete(false);
  };

  return (
      <div className="App bg-gray-900 text-white min-h-screen flex flex-col">
        <header className="bg-gray-800 p-4 shadow-md">
          <h1 className="text-xl font-bold">ZipZap - Zip Bomb Generator</h1>
          <p className="text-sm text-gray-400">For educational purposes only</p>
        </header>

        <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
          {!success ? (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Configuration</h2>

                <div className="mb-4">
                  <label className="block mb-2 font-medium">Base File Size (MB)</label>
                  <input
                      type="range"
                      min="1"
                      max="50"
                      value={fileSize}
                      onChange={handleSizeChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span>1 MB</span>
                    <span>{fileSize} MB</span>
                    <span>50 MB</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block mb-2 font-medium">Nesting Levels</label>
                  <select
                      value={levels}
                      onChange={handleLevelsChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="1">1 (Simple)</option>
                    <option value="2">2 (Nested)</option>
                    <option value="3">3 (Complex)</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-medium">Output Directory</label>
                  <input
                      type="text"
                      value={outputDir}
                      onChange={handleOutputDirChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>

                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Estimated Output</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Base File:</p>
                      <p className="font-mono">{fileSize} MB</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Nesting:</p>
                      <p className="font-mono">{levels} level{levels > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Duplicates:</p>
                      <p className="font-mono">10x</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Extracted Size:</p>
                      <p className={`font-mono ${estimatedSize > 100 ? 'text-red-400' : 'text-green-400'}`}>
                        ~{estimatedSize} MB
                        {estimatedSize > 100 && ' (Password Required)'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                    onClick={handleStartGeneration}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Generate Zip Bomb
                </button>
              </div>
          ) : (
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Generation Progress</h2>

                <div className="mb-6">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: generationComplete ? "100%" : "75%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                  <p className="font-mono">{generationStatus}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-400">Output Directory:</p>
                    <p className="font-mono">{outputDir}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Extracted Size:</p>
                    <p className="font-mono">~{estimatedSize} MB</p>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
                  <button
                      onClick={createNewZipBomb}
                      className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                  >
                    Create Another
                  </button>

                  <button
                      onClick={handleDownload}
                      disabled={!downloadLink}
                      className={`flex-1 py-2 px-4 font-medium rounded-lg flex items-center justify-center 
                  ${downloadLink
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 opacity-50 cursor-not-allowed text-gray-300'}`}
                  >
                    <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    {downloadLink ? 'Download Zip' : 'Generating...'}
                  </button>
                </div>
              </div>
          )}
        </main>

        {/* Password Modal */}
        {showPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Password Required</h2>
                <p className="mb-4 text-gray-300">
                  The extracted size will be over 100MB. Please enter the verification password to continue.
                </p>

                <div className="mb-4">
                  <label className="block mb-2 font-medium">Password</label>
                  <input
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      disabled={blocked}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  {passwordError && <p className="mt-2 text-red-400 text-sm">{passwordError}</p>}

                  {blocked && (
                      <div className="mt-2 text-yellow-400 text-sm">
                        Account locked. Try again in {Math.floor(blockTimeRemaining / 60)}:{blockTimeRemaining % 60 < 10 ? '0' : ''}{blockTimeRemaining % 60}
                      </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                      onClick={cancelPasswordModal}
                      className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handlePasswordSubmit}
                      disabled={blocked || loading}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg"
                  >
                    {loading ? 'Verifying...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
        )}

        <footer className="bg-gray-800 p-4 text-center text-gray-400 text-sm">
          <p>© 2025 Security Research Tool - For Educational Purposes Only</p>
        </footer>
      </div>
  );
}

export default App;
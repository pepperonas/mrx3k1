// ZipBombService.js - Handles the creation of the zip bomb and password verification

const API_URL = 'http://localhost:4996';

class ZipBombService {
  /**
   * Verifies the password with the server
   * @param {string} password - The password to verify
   * @returns {Promise<Object>} The server response
   */
  async verifyPassword(password) {
    try {
      const response = await fetch(`${API_URL}/api/checkPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        // If response is 429 (Too Many Requests), handle rate limiting
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.message || 'Rate limit exceeded. Please try again later.');
        }

        throw new Error(`Server responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Generates a zip bomb with the given parameters
   * @param {Object} params - The parameters for the zip bomb
   * @param {number} params.fileSize - The size of the original file in MB
   * @param {number} params.levels - The number of nesting levels
   * @param {string} params.outputDir - The output directory
   * @param {Function} statusCallback - Callback function to update generation status
   * @returns {Promise<Object>} Information about the generated zip bomb
   */
  async generateZipBomb(params, statusCallback = () => {}) {
    const { fileSize, levels, outputDir } = params;

    try {
      // For frontend demo purposes, we'll simulate the creation process
      // In a real application, this would call the actual creation function

      // Update status: starting
      statusCallback('Starting zip bomb generation...');
      await this.delay(500);

      // Update status: creating base file
      statusCallback(`Creating base file (${fileSize} MB)...`);
      await this.delay(1000);

      // Update status: compression steps
      for (let i = 0; i < levels; i++) {
        statusCallback(`Compressing level ${i + 1} of ${levels}...`);
        await this.delay(800);
      }

      // Update status: finalizing
      statusCallback('Finalizing zip bomb...');
      await this.delay(1200);

      // Calculate final statistics
      const compressedSize = (fileSize / 100).toFixed(2);
      const uncompressedSize = fileSize * 10;
      const compressionRatio = (uncompressedSize / compressedSize).toFixed(2);

      // Final status update
      statusCallback(`Done! Created zip bomb at '${outputDir}' (${compressedSize} MB compressed, expands to ${uncompressedSize} MB, ratio ${compressionRatio}:1)`);

      // In a real application, we would return information about the actual file
      return {
        filePath: `${outputDir}/level_${levels - 1}.zip`,
        compressedSize,
        uncompressedSize,
        compressionRatio
      };
    } catch (error) {
      statusCallback(`Error: ${error.message}`);
      console.error('Error generating zip bomb:', error);
      throw error;
    }
  }

  /**
   * Creates a downloadable blob for the zip bomb
   * @param {Object} params - Parameters for the zip bomb
   * @returns {Promise<Blob>} The blob representing the zip bomb
   */
  async createDownloadableZip(params) {
    const { fileSize, levels } = params;

    // In a real application, we would fetch the actual zip file from the server
    // For demo purposes, we'll create a simple placeholder blob

    // Create a simple ArrayBuffer with some content to simulate the zip file
    const headerContent = `ZipZap Bomb Demo
Generated: ${new Date().toISOString()}
Base Size: ${fileSize} MB
Levels: ${levels}
WARNING: This file will expand to approximately ${fileSize * 10} MB when fully extracted.
For educational purposes only.
`;

    // Convert the header to bytes
    const headerBytes = new TextEncoder().encode(headerContent);

    // Create a buffer with some random data to simulate file size
    const simulatedSize = Math.min(fileSize * 1024, 100 * 1024); // Limit to 100KB for demo
    const buffer = new ArrayBuffer(simulatedSize);
    const view = new Uint8Array(buffer);

    // Fill with pseudo-random data
    for (let i = 0; i < simulatedSize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }

    // Copy header to the beginning
    view.set(headerBytes, 0);

    // Create blob from the buffer
    return new Blob([buffer], { type: 'application/zip' });
  }

  /**
   * Creates a download link for a zip bomb
   * @param {Blob} blob - The blob to create a download link for
   * @param {string} filename - The name of the file to download
   * @returns {string} The URL for the download
   */
  createDownloadLink(blob, filename) {
    const url = URL.createObjectURL(blob);
    return url;
  }

  /**
   * Helper method to simulate delay
   * @param {number} ms - The delay in milliseconds
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ZipBombService();
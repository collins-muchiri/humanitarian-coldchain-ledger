// contracts/ledger.js - Hash-chained ledger manager for the humanitarian cold-chain simulation
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Blockchain {
  /**
   * @param {string} [ledgerPath] directory holding block_*.json files.
   *   Defaults to <repo>/ledger-data. Parameterised so tests (and alternate
   *   deployments) can run against isolated directories.
   */
  constructor(ledgerPath) {
    const explicit = Boolean(ledgerPath);
    this.ledgerPath = ledgerPath || path.join(__dirname, '..', 'ledger-data');

    // The DEFAULT ledger directory is created on first run (fresh checkout).
    // An EXPLICITLY configured path is never auto-created: a missing
    // LEDGER_DIR is a deployment/configuration error and must surface (health
    // probe reports 503, writes fail with ENOENT) instead of being silently
    // repaired into an empty chain that looks healthy.
    if (!explicit && !fs.existsSync(this.ledgerPath)) {
      fs.mkdirSync(this.ledgerPath, { recursive: true });
    }

    // Check if chain already exists by looking for block files
    this.chainExists = fs.existsSync(this.ledgerPath) ? this.checkChainExists() : false;
  }

  /**
   * Checks if a blockchain already exists in the ledger-data folder
   * @returns {boolean} True if chain exists, false otherwise
   */
  checkChainExists() {
    const files = fs.readdirSync(this.ledgerPath);
    return files.some(file => file.startsWith('block_') && file.endsWith('.json'));
  }

  /**
   * Gets the latest block from the ledger-data folder
   * @returns {Object|null} The latest block object or null if no blocks exist
   */
  getLatestBlock() {
    const files = fs.readdirSync(this.ledgerPath);
    if (files.length === 0) {
      return null;
    }

    // Find the highest numbered block file
    let maxIndex = -1;
    let latestFile = null;

    files.forEach(file => {
      if (file.startsWith('block_') && file.endsWith('.json')) {
        const index = parseInt(file.match(/block_(\d+)\.json/)[1]);
        if (index > maxIndex) {
          maxIndex = index;
          latestFile = file;
        }
      }
    });

    if (latestFile) {
      const filePath = path.join(this.ledgerPath, latestFile);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    return null;
  }

  /**
   * Adds a new block to the blockchain
   * @param {Object} data - The data to store in the block
   */
  addBlock(data) {
    const latestBlock = this.getLatestBlock();
    const index = latestBlock ? latestBlock.index + 1 : 0;
    
    // Calculate previous hash
    const previousHash = latestBlock ? latestBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
    
    // Create the new block. The timestamp is captured ONCE: hashing a
    // different instant than the one stored corrupts the block at birth
    // whenever the two reads straddle a millisecond boundary (defect HCL-005;
    // regression-probed by tests/ledger.test.js with 4000 blocks).
    const timestamp = new Date().toISOString();
    const newBlock = {
      index,
      timestamp,
      data,
      previousHash,
      hash: this.calculateHash(index, timestamp, data, previousHash)
    };

    // Save the block as a JSON file
    const fileName = `block_${index}.json`;
    const filePath = path.join(this.ledgerPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(newBlock, null, 2), 'utf8');

    console.log(`Block ${index} added to ledger.`);
  }

  /**
   * Calculates the SHA-256 hash of a block
   * @param {number} index - Block index
   * @param {string} timestamp - Block timestamp
   * @param {Object} data - Block data
   * @param {string} previousHash - Previous block's hash
   * @returns {string} The calculated hash
   */
  calculateHash(index, timestamp, data, previousHash) {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256')
      .update(index + timestamp + dataString + previousHash)
      .digest('hex');
  }
}

module.exports = Blockchain;
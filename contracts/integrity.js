// contracts/integrity.js - shared hash-chain verification used by the API
// health probe, the audit CLI, and the test suite (single source of truth;
// previously bin/audit-ledger.js duplicated this logic).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const GENESIS_PREVIOUS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * SHA-256 over the canonical block fields.
 * @param {number} index
 * @param {string} timestamp
 * @param {Object} data
 * @param {string} previousHash
 * @returns {string} hex digest
 */
function calculateHash(index, timestamp, data, previousHash) {
  const dataString = JSON.stringify(data);
  return crypto
    .createHash("sha256")
    .update(index + timestamp + dataString + previousHash)
    .digest("hex");
}

/**
 * Loads block_*.json files from a ledger directory, sorted by index.
 * @param {string} ledgerPath
 * @returns {Object[]} blocks
 */
function loadChain(ledgerPath) {
  if (!fs.existsSync(ledgerPath)) return [];
  const files = fs
    .readdirSync(ledgerPath)
    .filter((f) => /^block_\d+\.json$/.test(f))
    .sort(
      (a, b) =>
        parseInt(a.match(/block_(\d+)\.json/)[1], 10) -
        parseInt(b.match(/block_(\d+)\.json/)[1], 10),
    );
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(ledgerPath, f), "utf8")));
}

/**
 * Verifies self-hash of every block, index continuity, and previousHash links.
 * Never throws on corrupt data: corruption is reported, not hidden.
 * @param {string} ledgerPath
 * @returns {{blockCount: number, valid: boolean, errors: string[]}}
 */
function verifyChain(ledgerPath) {
  const errors = [];
  if (!fs.existsSync(ledgerPath)) {
    return { blockCount: 0, valid: false, errors: [`ledger directory missing: ${ledgerPath}`] };
  }
  let blocks;
  try {
    blocks = loadChain(ledgerPath);
  } catch (err) {
    return { blockCount: 0, valid: false, errors: [`unreadable ledger: ${err.message}`] };
  }
  blocks.forEach((block, i) => {
    if (block.index !== i) {
      errors.push(`block file position ${i} carries index ${block.index}`);
    }
    const expected = calculateHash(block.index, block.timestamp, block.data, block.previousHash);
    if (block.hash !== expected) {
      errors.push(`block ${block.index}: self-hash mismatch (stored ${block.hash}, recomputed ${expected})`);
    }
    const expectedPrev = i === 0 ? GENESIS_PREVIOUS_HASH : blocks[i - 1].hash;
    if (block.previousHash !== expectedPrev) {
      errors.push(`block ${block.index}: previousHash does not match predecessor`);
    }
  });
  return { blockCount: blocks.length, valid: errors.length === 0, errors };
}

module.exports = { calculateHash, loadChain, verifyChain, GENESIS_PREVIOUS_HASH };

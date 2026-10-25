// index.js - Genesis logic script to initialize the environment
require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const path = require('path');
const { generateKeyPair, signData } = require('./identity/crypto-util');
const { MedicalKit } = require('./contracts/asset');
const { calculateHash, GENESIS_PREVIOUS_HASH } = require('./contracts/integrity');

console.log('Initializing Humanitarian Cold-Chain Ledger simulation...\n');

// Step 1: Generate a key pair for 'hq'
console.log('Step 1: Generating key pair for HQ...');
const hqKeys = generateKeyPair();
console.log('HQ Public Key:', hqKeys.publicKey.substring(0, 20) + '...'); // Show first 20 chars
console.log('HQ Private Key (truncated):', hqKeys.privateKey.substring(0, 20) + '...\n');

// Save the HQ keys to the identity directory
const hqDir = path.join(__dirname, 'identity', 'hq');
const privateKeyPath = path.join(hqDir, 'private-key.txt');
const publicKeyPath = path.join(hqDir, 'public-key.txt');

fs.writeFileSync(privateKeyPath, hqKeys.privateKey, 'utf8');
fs.writeFileSync(publicKeyPath, hqKeys.publicKey, 'utf8');

console.log('Keys saved to identity/hq/\n');

// Step 2: Create a test MedicalKit object
console.log('Step 2: Creating a test MedicalKit object...');
const testMedicalKit = new MedicalKit(
  'KIT-001',           // kitID
  'Emergency',         // type
  'Geneva, Switzerland', // origin
  4,                   // temperature (in Celsius)
  'Geneva Warehouse',  // location
  hqKeys.privateKey // private key for signing
);

console.log('Test MedicalKit created:', JSON.stringify(testMedicalKit.toObject(), null, 2));

// Step 3: Hash the test MedicalKit object into a 'Block 0' format
console.log('\nStep 3: Creating Genesis Block (Block 0)...');

// Hash the genesis block with the SAME scheme the chain verifier uses
// (previously a one-off sha256 of the kit JSON that no verifier checks).
const genesisTimestamp = new Date().toISOString();
const genesisData = testMedicalKit.toObject();
const genesisBlock = {
  index: 0,
  timestamp: genesisTimestamp,
  data: genesisData,
  previousHash: GENESIS_PREVIOUS_HASH,
  hash: calculateHash(0, genesisTimestamp, genesisData, GENESIS_PREVIOUS_HASH),
  validator: 'HQ'
};

console.log('Genesis Block created:', JSON.stringify(genesisBlock, null, 2));

// Save the Genesis Block - only for a fresh environment. Re-running init
// must never overwrite existing ledger artefacts (overwrite disguised as
// success is data loss; see docs/DECISIONS.md).
const ledgerDir = process.env.LEDGER_DIR || path.join(__dirname, 'ledger-data');
const ledgerDataPath = path.join(ledgerDir, 'genesis-block.json');
const existing = fs.existsSync(ledgerDir)
  ? fs.readdirSync(ledgerDir).filter((f) => f.endsWith('.json'))
  : [];
if (existing.length > 0) {
  console.log(`Ledger data already present (${existing.length} file(s)) - skipping genesis write (no overwrite by design).`);
} else {
  fs.mkdirSync(ledgerDir, { recursive: true });
  fs.writeFileSync(ledgerDataPath, JSON.stringify(genesisBlock, null, 2), 'utf8');
  console.log('\nGenesis Block saved to ' + ledgerDataPath);
}

// Step 4: Verify the signature of the MedicalKit
console.log('\nStep 4: Verifying MedicalKit signature...');
const isValid = testMedicalKit.verifySignature(hqKeys.publicKey);
console.log('Signature verification result:', isValid ? 'VALID' : 'INVALID');

console.log('\nInitialization complete!');
console.log('System is ready for humanitarian supply chain tracking.');
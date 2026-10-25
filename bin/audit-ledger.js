#!/usr/bin/env node
// bin/audit-ledger.js - Chain integrity audit CLI for the humanitarian
// cold-chain ledger simulation. Exits non-zero when the chain is invalid
// (previously printed "COMPROMISED" and still exited 0 - silent failure).
const path = require('path');
const { verifyChain } = require('../contracts/integrity');

const ledgerPath = process.env.LEDGER_DIR || path.join(__dirname, '..', 'ledger-data');
const report = verifyChain(ledgerPath);

console.log('--- Chain Integrity Audit ---');
console.log(`Ledger: ${ledgerPath}`);
console.log(`Blocks: ${report.blockCount}`);
if (report.valid) {
  console.log('CHAIN INTEGRITY VERIFIED: every self-hash and link recomputed clean.');
} else {
  console.error('CHAIN INTEGRITY COMPROMISED:');
  for (const err of report.errors) {
    console.error(` - ${err}`);
  }
  process.exitCode = 1;
}

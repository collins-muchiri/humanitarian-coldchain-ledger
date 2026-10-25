// tests/ledger.test.js - hash-chain correctness (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const Blockchain = require("../contracts/ledger");
const { verifyChain, calculateHash } = require("../contracts/integrity");

const REPO_LEDGER = path.join(__dirname, "..", "ledger-data");

function tmpLedgerDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hcl-ledger-test-"));
}

test("addBlock: stored hash always recomputes from stored fields (Date race probe)", () => {
  // Defect: addBlock called `new Date().toISOString()` twice - once for the
  // stored `timestamp`, once inside the hash input. When the two calls straddle
  // a millisecond boundary the block is born with a hash that does not match
  // its own stored fields. This probe writes enough blocks that straddling is
  // near-certain (p_fail ~ 1 - (1 - p_ms)^N).
  const dir = tmpLedgerDir();
  const chain = new Blockchain(dir);
  const realLog = console.log;
  console.log = () => {}; // silence per-block chatter (not the unit under test)
  try {
    const N = 4000;
    for (let i = 0; i < N; i++) {
      chain.addBlock({ i, note: "race probe" });
    }
  } finally {
    console.log = realLog;
  }
  const report = verifyChain(dir);
  assert.strictEqual(report.blockCount, 4000);
  assert.deepStrictEqual(report.errors, [], "chain corrupted by addBlock timestamp race");
});

test("committed demo chain (ledger-data) passes full verification", () => {
  const report = verifyChain(REPO_LEDGER);
  assert.ok(report.blockCount >= 15, `expected >=15 blocks, got ${report.blockCount}`);
  assert.strictEqual(report.valid, true, `committed chain invalid: ${report.errors.join("; ")}`);
});

test("verifyChain detects data tampering (break-it proof for the verifier)", () => {
  const dir = tmpLedgerDir();
  const chain = new Blockchain(dir);
  const realLog = console.log;
  console.log = () => {};
  try {
    chain.addBlock({ kit: "KIT-1", temp: 4 });
    chain.addBlock({ kit: "KIT-2", temp: 5 });
  } finally {
    console.log = realLog;
  }
  assert.strictEqual(verifyChain(dir).valid, true);

  // Tamper mode 1: mutate block 0 payload without recomputing its hash
  const f0 = path.join(dir, "block_0.json");
  const b0 = JSON.parse(fs.readFileSync(f0, "utf8"));
  b0.data.temp = 99;
  fs.writeFileSync(f0, JSON.stringify(b0, null, 2));

  const payloadTampered = verifyChain(dir);
  assert.strictEqual(payloadTampered.valid, false, "payload tampering must be detected");
  assert.ok(payloadTampered.errors.some((e) => e.includes("block 0: self-hash mismatch")));
  // block 1's link still holds: it chains to block 0's STORED hash, which was
  // not touched. Restoring data clears the error entirely.
  assert.ok(!payloadTampered.errors.some((e) => e.includes("previousHash")));
  fs.writeFileSync(f0, JSON.stringify({ ...b0, data: { kit: "KIT-1", temp: 4 } }, null, 2));
  assert.strictEqual(verifyChain(dir).valid, true, "restore must clear errors");

  // Tamper mode 2: rewrite block 0's hash -> breaks block 1's link too
  const b0b = JSON.parse(fs.readFileSync(f0, "utf8"));
  b0b.hash = "deadbeef" + b0b.hash.slice(8);
  fs.writeFileSync(f0, JSON.stringify(b0b, null, 2));
  const hashTampered = verifyChain(dir);
  assert.strictEqual(hashTampered.valid, false, "hash tampering must be detected");
  assert.ok(hashTampered.errors.some((e) => e.includes("self-hash mismatch")));
  assert.ok(hashTampered.errors.some((e) => e.includes("previousHash")));
});

test("verifyChain reports unreadable/missing ledger instead of throwing", () => {
  const report = verifyChain(path.join(os.tmpdir(), "definitely-missing-ledger-dir"));
  assert.strictEqual(report.blockCount, 0);
  assert.strictEqual(report.valid, false);
});

test("calculateHash is deterministic and order-sensitive", () => {
  const h1 = calculateHash(1, "2026-01-01T00:00:00.000Z", { a: 1 }, "prev");
  const h2 = calculateHash(1, "2026-01-01T00:00:00.000Z", { a: 1 }, "prev");
  const h3 = calculateHash(1, "2026-01-01T00:00:00.001Z", { a: 1 }, "prev");
  assert.strictEqual(h1, h2);
  assert.notStrictEqual(h1, h3, "1ms timestamp difference must change the hash");
});

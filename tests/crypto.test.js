// tests/crypto.test.js - identity/crypto-util behaviour (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const { generateKeyPair, signData, verifySignature } = require("../identity/crypto-util");

test("generateKeyPair returns hex private/public keys", () => {
  const k = generateKeyPair();
  assert.ok(k.privateKey && k.publicKey, "keys must be present");
  assert.match(k.privateKey, /^[0-9a-f]+$/i, "private key must be hex");
  assert.match(k.publicKey, /^[0-9a-f]+$/i, "public key must be hex");
});

test("generated key pairs are distinct", () => {
  const a = generateKeyPair();
  const b = generateKeyPair();
  assert.notStrictEqual(a.privateKey, b.privateKey);
});

test("sign/verify round-trips", () => {
  const k = generateKeyPair();
  const msg = "KIT-101|Vaccine|4C|Nairobi Hub";
  const sig = signData(msg, k.privateKey);
  assert.strictEqual(verifySignature(msg, sig, k.publicKey), true);
});

test("verification fails on tampered message", () => {
  const k = generateKeyPair();
  const sig = signData("temperature=4", k.privateKey);
  assert.strictEqual(verifySignature("temperature=99", sig, k.publicKey), false,
    "tampered payload must NOT verify");
});

test("verification fails with the wrong public key", () => {
  const a = generateKeyPair();
  const b = generateKeyPair();
  const sig = signData("payload", a.privateKey);
  assert.strictEqual(verifySignature("payload", sig, b.publicKey), false,
    "foreign key must NOT verify");
});

test("signing is deterministic for the same key and message", () => {
  const k = generateKeyPair();
  assert.strictEqual(signData("m", k.privateKey), signData("m", k.privateKey));
});

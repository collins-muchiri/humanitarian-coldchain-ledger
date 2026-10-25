// tests/asset.test.js - MedicalKit asset model (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const { MedicalKit } = require("../contracts/asset");
const { generateKeyPair } = require("../identity/crypto-util");

function makeKit(overrides = {}) {
  const keys = generateKeyPair();
  const kit = new MedicalKit(
    overrides.kitID || "KIT-100",
    overrides.type || "Vaccine",
    overrides.origin || "Central Warehouse",
    overrides.temperature !== undefined ? overrides.temperature : 4,
    overrides.location || "Nairobi Hub",
    keys.privateKey,
  );
  return { kit, keys };
}

test("constructor populates all fields and self-signs", () => {
  const { kit } = makeKit();
  assert.strictEqual(kit.kitID, "KIT-100");
  assert.strictEqual(kit.temperature, 4);
  assert.ok(kit.timestamp, "timestamp must be set");
  assert.ok(kit.signature && kit.signature.length > 0, "kit must carry a signature");
});

test("verifySignature true for the signing key", () => {
  const { kit, keys } = makeKit();
  assert.strictEqual(kit.verifySignature(keys.publicKey), true);
});

test("verifySignature false for a foreign key", () => {
  const { kit } = makeKit();
  const stranger = generateKeyPair();
  assert.strictEqual(kit.verifySignature(stranger.publicKey), false);
});

test("field tampering invalidates the signature (cold-chain integrity)", () => {
  const { kit, keys } = makeKit({ temperature: 4 });
  kit.temperature = 12; // excursion fraud attempt
  assert.strictEqual(kit.verifySignature(keys.publicKey), false,
    "mutating a signed field must break verification");
});

test("toObject exposes exactly the persisted shape", () => {
  const { kit } = makeKit();
  const obj = kit.toObject();
  assert.deepStrictEqual(Object.keys(obj).sort(),
    ["kitID", "location", "origin", "signature", "temperature", "timestamp", "type"]);
});

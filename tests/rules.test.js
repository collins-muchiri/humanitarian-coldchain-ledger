// tests/rules.test.js - validateMedicalKit business rules (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const { validateMedicalKit } = require("../contracts/rules");
const { MedicalKit } = require("../contracts/asset");
const { generateKeyPair } = require("../identity/crypto-util");

function kitAt(temperature) {
  const keys = generateKeyPair();
  const kit = new MedicalKit("KIT-200", "Vaccine", "Central Warehouse", temperature, "Hub A", keys.privateKey);
  return { obj: kit.toObject(), pub: keys.publicKey, kit };
}

test("kit within 2-8C with valid signature passes", () => {
  for (const t of [2, 4, 6.5, 8]) {
    const { obj, pub } = kitAt(t);
    const r = validateMedicalKit(obj, pub);
    assert.strictEqual(r.isValid, true, `temperature ${t} should be valid: ${r.errors}`);
    assert.deepStrictEqual(r.errors, []);
  }
});

test("temperature above 8C is rejected with a range error", () => {
  const { obj, pub } = kitAt(12);
  const r = validateMedicalKit(obj, pub);
  assert.strictEqual(r.isValid, false);
  assert.ok(r.errors.some((e) => e.includes("Temperature out of safe range")));
});

test("temperature below 2C is rejected (freeze risk)", () => {
  const { obj, pub } = kitAt(-1);
  const r = validateMedicalKit(obj, pub);
  assert.strictEqual(r.isValid, false);
  assert.ok(r.errors.some((e) => e.includes("Temperature out of safe range")));
});

test("missing signature is rejected", () => {
  const { obj, pub } = kitAt(4);
  delete obj.signature;
  const r = validateMedicalKit(obj, pub);
  assert.strictEqual(r.isValid, false);
  assert.ok(r.errors.some((e) => e.includes("Missing digital signature")));
});

test("tampered payload fails signature verification", () => {
  const { obj, pub } = kitAt(4);
  obj.temperature = 9; // payload edited after signing; signature kept
  const r = validateMedicalKit(obj, pub);
  assert.strictEqual(r.isValid, false);
  assert.ok(r.errors.some((e) => e.includes("Invalid cryptographic signature") ||
                                 e.includes("Temperature out of safe range")),
    `tamper must surface an error, got: ${JSON.stringify(r.errors)}`);
});

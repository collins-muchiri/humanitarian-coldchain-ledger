// DEMO script (print-oriented); it mutates state by design. Assertion-backed tests live in tests/ (npm test).
// Test the validation logic
const { validateMedicalKit } = require('../contracts/rules');
const { MedicalKit } = require('../contracts/asset');
const cryptoUtil = require('../identity/crypto-util');

console.log('--- Testing Medical Kit Validation ---');

// Generate keys for testing
const keys = cryptoUtil.generateKeyPair();

// Create a valid medical kit
const validKit = new MedicalKit("KIT-001", "Vaccine", "Central Warehouse", 4, "Warehouse", keys.privateKey);
const validationResult = validateMedicalKit(validKit.toObject(), keys.publicKey);

console.log('Valid kit validation result:', validationResult);
if (!validationResult.isValid) {
    process.exitCode = 1;
    console.error('DEMO FAILURE: valid kit was rejected');
}

// Create an invalid medical kit (temperature out of range)
const invalidKit = new MedicalKit("KIT-002", "Vaccine", "Central Warehouse", 15, "Warehouse", keys.privateKey); // 15°C is too high
const invalidValidationResult = validateMedicalKit(invalidKit.toObject(), keys.publicKey);

console.log('Invalid kit validation result:', invalidValidationResult);
if (invalidValidationResult.isValid) {
    process.exitCode = 1;
    console.error('DEMO FAILURE: temperature-excursion kit was accepted');
}

console.log('--- Validation Test Complete ---');
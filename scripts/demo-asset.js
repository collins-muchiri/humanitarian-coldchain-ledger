// DEMO script (print-oriented); it mutates state by design. Assertion-backed tests live in tests/ (npm test).
const { MedicalKit } = require('../contracts/asset');
const cryptoUtil = require('../identity/crypto-util'); // We need this to get a key

try {
    // STEP 1: Generate a real key pair first
    const keys = cryptoUtil.generateKeyPair();
    const myPrivateKey = keys.privateKey;
    const myPublicKey = keys.publicKey;

    console.log("--- Starting Asset Test ---");

    // STEP 2: Pass the privateKey as the 6th argument
    const myKit = new MedicalKit(
        "KIT-101",      // kitID
        "Surgical",     // type
        "Central Warehouse",    // origin
        4,              // temperature
        "Warehouse A",  // location
        myPrivateKey    // 6th Argument: The Private Key!
    );

    console.log("✅ Success! Medical Kit Created.");
    console.log("📦 Kit ID:", myKit.kitID);
    console.log("🔏 Signature:", myKit.signature.substring(0, 20) + "...");

    // STEP 3: Test the verification function
    const isSignatureValid = myKit.verifySignature(myPublicKey);
    console.log("🛡️  Signature Verified:", isSignatureValid ? "YES" : "NO");
    if (!isSignatureValid) process.exitCode = 1;

} catch (error) {
    process.exitCode = 1; console.error("❌ Test Failed!");
    process.exitCode = 1; console.error("Reason:", error.message);
    console.log("\nEngineer Tip: Ensure your crypto-util.js functions are correctly exported!");
}
// tests/api.test.js - HTTP surface against a real spawned server (node:test)
// The server is exercised as a black box over HTTP: no in-process shortcuts,
// so PORT/LEDGER_DIR wiring, routing and status codes are all under test.
const { test, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const REPO = path.join(__dirname, "..");
const children = [];
let nextPort = 31501;

function startServer(env = {}) {
  const port = nextPort++;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: REPO,
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", () => {});
  children.push(child);
  return { child, port, base: `http://127.0.0.1:${port}` };
}

async function waitReady(base, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      await fetch(`${base}/health`);
      return; // any HTTP status counts as "up"
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`server at ${base} never became ready: ${lastErr}`);
}

function scratchLedger() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hcl-api-ledger-"));
  fs.cpSync(path.join(REPO, "ledger-data"), dir, { recursive: true });
  return dir;
}

after(() => {
  for (const c of children) {
    try { c.kill("SIGKILL"); } catch { /* already gone */ }
  }
});

test("GET /health is 200 and reports a valid chain for the committed ledger", async () => {
  const srv = startServer();
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, "OK");
  assert.strictEqual(body.ledger.chainValid, true);
  assert.ok(body.ledger.blockCount >= 15, `expected >=15 blocks, got ${body.ledger.blockCount}`);
});

test("GET /health goes RED (503) when the ledger dependency is missing", async () => {
  // Mission rule 9.2: a health check that cannot go red is decoration.
  const srv = startServer({ LEDGER_DIR: path.join(os.tmpdir(), `hcl-missing-${Date.now()}`) });
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/health`);
  assert.strictEqual(res.status, 503);
  const body = await res.json();
  assert.strictEqual(body.status, "DEGRADED");
  assert.strictEqual(body.ledger.chainValid, false);
  assert.ok(body.ledger.errors.length > 0, "degraded health must explain itself");
});

test("GET /ledger returns the chain; unknown routes return JSON 404", async () => {
  const srv = startServer();
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/ledger`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.blockCount >= 15);
  const miss = await fetch(`${srv.base}/definitely-not-a-route`);
  assert.strictEqual(miss.status, 404);
  const missBody = await miss.json();
  assert.strictEqual(missBody.success, false);
});

test("POST /add-kit: valid kit appends a verifiable block to the configured ledger", async () => {
  const dir = scratchLedger();
  const srv = startServer({ LEDGER_DIR: dir });
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/add-kit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kitID: "KIT-TEST-1", type: "Vaccine", origin: "Central Warehouse",
      temperature: 4, location: "Test Hub",
    }),
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  // the committed repo chain must be untouched; the scratch chain grew by one
  const { verifyChain } = require("../contracts/integrity");
  const scratch = verifyChain(dir);
  assert.ok(scratch.valid, `scratch chain invalid: ${scratch.errors}`);
  const committed = verifyChain(path.join(REPO, "ledger-data"));
  assert.strictEqual(committed.blockCount, 15, "test run must not mutate the committed chain");
});

test("POST /add-kit: temperature excursion is rejected 400 and not appended", async () => {
  const dir = scratchLedger();
  const srv = startServer({ LEDGER_DIR: dir });
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/add-kit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kitID: "KIT-TEST-2", type: "Vaccine", origin: "Central Warehouse",
      temperature: 15, location: "Test Hub",
    }),
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.success, false);
  assert.ok(body.errors.some((e) => /temperature/i.test(e)));
  const { verifyChain } = require("../contracts/integrity");
  assert.strictEqual(verifyChain(dir).blockCount, 15, "rejected kit must not be appended");
});

test("POST /add-kit: missing fields are rejected 400", async () => {
  const dir = scratchLedger();
  const srv = startServer({ LEDGER_DIR: dir });
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/add-kit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kitID: "KIT-TEST-3" }),
  });
  assert.strictEqual(res.status, 400);
});

test("GET /api/markets returns a list", async () => {
  const srv = startServer();
  await waitReady(srv.base);
  const res = await fetch(`${srv.base}/api/markets`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.markets ?? body), "markets endpoint must return a list");
});

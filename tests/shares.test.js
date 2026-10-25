// tests/shares.test.js - ShareManager accounting (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const { PredictionMarket } = require("../contracts/market");
const { ShareManager } = require("../contracts/shares");

function setup() {
  const sm = new ShareManager();
  const market = new PredictionMarket("MKT-T1", "Arrive on time?", "KIT-1",
    new Date(Date.now() + 86400000).toISOString(), "admin");
  return { sm, market };
}

test("initializeUser grants the default 10000 credits exactly once", () => {
  const { sm } = setup();
  sm.initializeUser("alice");
  assert.strictEqual(sm.getBalance("alice").credits, 10000);
  sm.initializeUser("alice", 5); // must NOT reset an existing account
  assert.strictEqual(sm.getBalance("alice").credits, 10000);
});

test("buy deducts the exact cost and records holdings", () => {
  const { sm, market } = setup();
  const tx = sm.buyShares("alice", market, "YES", 100);
  assert.ok(tx.cost > 0);
  assert.strictEqual(sm.getBalance("alice").credits, 10000 - tx.cost);
  assert.strictEqual(sm.getUserPositions("alice").holdings["MKT-T1"].YES, 100);
});

test("sell credits the payout back to the user", () => {
  const { sm, market } = setup();
  sm.buyShares("alice", market, "YES", 100);
  const creditsBefore = sm.getBalance("alice").credits;
  const sale = sm.sellShares("alice", market, "YES", 40);
  assert.ok(sale.payout > 0);
  assert.strictEqual(sm.getBalance("alice").credits, creditsBefore + sale.payout);
  assert.strictEqual(sm.getUserPositions("alice").holdings["MKT-T1"].YES, 60);
});

test("user stats stay finite across a full trade cycle (NaN-poisoning regression)", () => {
  // Defect: sellShares computed profit += payout - transaction.cost, but sell
  // transactions carry no `cost` field -> profit became NaN after first sale.
  const { sm, market } = setup();
  sm.buyShares("alice", market, "YES", 100);
  sm.sellShares("alice", market, "YES", 40);
  const stats = sm.userStats.alice;
  assert.strictEqual(stats.totalTrades, 2);
  assert.ok(Number.isFinite(stats.profit), `profit must be finite, got ${stats.profit}`);
  // exact cash-flow equality is asserted in the next test (buy cost vs sell payout)
});

test("profit equals net trading cash flow (buy cost vs sell payout)", () => {
  const { sm, market } = setup();
  const buy = sm.buyShares("bob", market, "NO", 50);
  const sell = sm.sellShares("bob", market, "NO", 50);
  const expected = sell.payout - buy.cost;
  assert.ok(Math.abs(sm.userStats.bob.profit - expected) < 1e-9,
    `profit ${sm.userStats.bob.profit} != expected ${expected}`);
  // credits must agree with the same cash flow
  assert.ok(Math.abs(sm.getBalance("bob").credits - (10000 + expected)) < 1e-9);
});

test("selling for an unknown user throws instead of silently creating accounts", () => {
  const { sm, market } = setup();
  assert.throws(() => sm.sellShares("ghost", market, "YES", 1), /not found/i);
});

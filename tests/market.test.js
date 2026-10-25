// tests/market.test.js - PredictionMarket (CPMM) behaviour (node:test + assert)
const { test } = require("node:test");
const assert = require("node:assert");
const { PredictionMarket } = require("../contracts/market");

function makeMarket(id = "MKT-1") {
  return new PredictionMarket(id, "Will KIT-100 arrive on time?", "KIT-100",
    new Date(Date.now() + 86400000).toISOString(), "admin");
}

test("new market opens OPEN with symmetric pools: cost(amount) = amount x 1.0", () => {
  // calculatePrice returns TOTAL COST for `amount` shares:
  // amount x (otherPool / currentPool); fresh pools are 1000/1000.
  const m = makeMarket();
  assert.strictEqual(m.status, "OPEN");
  assert.strictEqual(m.calculatePrice("YES", 10), 10);
  assert.strictEqual(m.calculatePrice("YES", 10), m.calculatePrice("NO", 10),
    "fresh pools are symmetric");
});

test("buying YES moves its price up (constant-product invariant)", () => {
  const m = makeMarket();
  const before = m.calculatePrice("YES", 10);
  const tx = m.buyShares("alice", "YES", 100);
  assert.strictEqual(tx.cost, 100); // 100 x (1000/1000)
  const after = m.calculatePrice("YES", 10);
  assert.ok(after > before, `YES cost must rise after buy (${before} -> ${after})`);
  assert.strictEqual(after, 11.11); // 10 x (1000/900), rounded to cents
  assert.strictEqual(m.positions.alice.YES, 100);
});

test("buying on a resolved market throws", () => {
  const m = makeMarket();
  m.resolve("YES");
  assert.strictEqual(m.status, "RESOLVED");
  assert.throws(() => m.buyShares("bob", "YES", 10), /not open/i);
});

test("resolving twice throws", () => {
  const m = makeMarket();
  m.resolve("NO");
  assert.throws(() => m.resolve("YES"));
});

test("selling more than held throws (no phantom liquidity)", () => {
  const m = makeMarket();
  m.buyShares("alice", "YES", 10);
  assert.throws(() => m.sellShares("alice", "YES", 50), /insufficient/i);
  assert.throws(() => m.sellShares("nobody", "YES", 1), /insufficient/i);
});

test("sell returns a payout and reduces the position", () => {
  const m = makeMarket();
  m.buyShares("alice", "YES", 100);
  const sale = m.sellShares("alice", "YES", 40);
  assert.ok(sale.payout > 0, "sale must pay out");
  assert.strictEqual(m.positions.alice.YES, 60);
});

# Humanitarian Cold-Chain Ledger

*Cold-chain integrity ledger prototype for humanitarian supply chains; JavaScript. Independent project, not affiliated with any agency.*

![category](https://img.shields.io/badge/category-monitoring-evaluation-8B5CF6?style=flat-square) ![language](https://img.shields.io/badge/language-JavaScript-2563EB?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-16A34A?style=flat-square) ![maintenance](https://img.shields.io/badge/maintenance-active-16A34A?style=flat-square) ![repo](https://img.shields.io/badge/repo-humanitarian--coldchain--ledger-111827?style=flat-square)

---

An append-only, hash-chained ledger prototype for humanitarian supply chains, with cold-chain
temperature compliance monitoring at 2 to 8 degrees Celsius, multi-location tracking and an audit
trail.

Read first: [DISCLAIMER.md](DISCLAIMER.md) and [docs/WHAT_THIS_LEDGER_IS.md](docs/WHAT_THIS_LEDGER_IS.md).
This project is independent and unaffiliated with any component of the International Red Cross and
Red Crescent Movement. All data is simulated; see [docs/SIMULATION_NOTE.md](docs/SIMULATION_NOTE.md).

## Features
Immutable application-level event log with hash chaining and tamper detection. Temperature
compliance monitoring with excursion alerts. Multi-location shipment tracking. Dashboard with
authentication. Simulated peer synchronisation for demonstration.

## What this is not
A distributed consensus system. See docs/WHAT_THIS_LEDGER_IS.md for the precise integrity guarantee
and its limits.

## Run
npm install, then npm start. Server honours `PORT` (default 3000) and `LEDGER_DIR`
(default `./ledger-data`). See package.json for scripts.

## Test
`npm test` runs the assertion-backed suite (`node --test tests/`, 40 tests): crypto
sign/verify and tamper detection, asset rules, hash-chain integrity (including a
4000-block timestamp-race probe), market and share accounting, and the HTTP API
against a spawned server (including the 503 degraded-health path).
`npm run audit-ledger` verifies the committed chain and exits non-zero on tampering.
Print-oriented demos live in `scripts/demo-*.js` (they mutate scratch state by design
and exit non-zero on failure).

## Licence
MIT.

## Contribution and license

Issues and pull requests are welcome — please open an issue describing the proposed change before submitting substantive work. This project is released under the MIT License.

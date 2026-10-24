# Humanitarian Cold-Chain Ledger

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
npm install, then npm start. See package.json for scripts.

## Licence
MIT.

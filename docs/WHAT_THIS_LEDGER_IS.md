# What this ledger is, and what it is not

Honesty about mechanism is what converts this prototype from a credibility risk into a teaching
asset.

What it is: an append-only, hash-chained application-level log of supply-chain events, with a
dashboard, authentication and simulated peer synchronisation. Each record carries the hash of its
predecessor, so tampering with history breaks the chain and is detectable.

What it is not: a distributed consensus system. There is no independent validator set, no consensus
protocol and no protection against an operator who controls the single writing application. An
attacker with write access to the application can rewrite history and re-hash the chain.

Consequences stated plainly:
- Integrity guarantee: detection of accidental or external tampering, yes. Protection against a
  compromised operator, no.
- The property a humanitarian cold-chain pilot actually needs first is the temperature-compliance
  audit trail, which this design provides without any consensus mechanism.
- A path to genuine distribution, if ever required, is a managed validator set across partner
  organisations with a documented consensus choice and a threat model. That is a different project
  and is not claimed here.

All ledger data in ledger-data/ is simulated. The generation method is stated in
docs/SIMULATION_NOTE.md.

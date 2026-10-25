# DECISIONS.md

Operator decisions for the Zero-Red Mandate pass (mission rule 11.6: safest reversible
option, recorded here, flagged in the final report).

## D-H1 (2026-10-25) Protected-name scrub scope: product surfaces neutralised, legal-context docs kept

- Context: the repository (formerly icrc-humanitarian-ledger) shipped the ICRC name in
  package metadata, runtime banners, the /health response body, UI pages, README title
  and code comments, plus author "Senior Blockchain Engineer" (false attribution).
- Decision: all product surfaces renamed to generic "humanitarian cold-chain ledger"
  wording; package set to private; author corrected to the real maintainer. ICRC
  references remain ONLY where legally necessary as context: DISCLAIMER.md,
  RENAMING_AND_LEGAL_PLAN.md, README's unaffiliation statement, and docs/ history notes.
- Committed chain data (ledger-data/block_*.json) contains origin "Geneva HQ" strings.
  They were NOT rewritten: blocks are hash-chained, editing them would break every
  downstream hash (the chain is the product's core invariant) and the string is a
  location label, not a protected name. New demo data uses "Central Warehouse".
- Reversible: n/a (legal-risk reduction; keeping the scrub is the safe state).

## D-H2 (2026-10-25) npm publish workflow removed; releases re-run gates instead

- Context: .github/workflows/npm-publish.yml published the package to npmjs AND GitHub
  Packages on every release. The package carried the protected name; publishing it
  publicly would have been a trademark and supply-chain incident. The app is a
  simulation, not a distributable library.
- Options: (a) keep publishing under a neutral name, (b) stop publishing, (c) gate
  releases without publishing.
- Decision: (b)+(c): package.json now has "private": true (npm refuses to publish),
  npm-publish.yml replaced by release-gate.yml which re-runs install/audit/tests/
  chain-audit on the tagged commit. This removes a job for a product reason (the
  publish target is itself the defect), NOT to make a red gate disappear - the test
  gate that made the old workflow red is kept and now passes for real.
- Reversible: re-add a publish workflow if the project ever becomes a library.

## D-H3 (2026-10-25) Node matrix 22.x/24.x

- Context: matrix was [18.x, 20.x, 22.x]. Node 18 went EOL 2025-04-30; Node 20 went
  EOL 2026-04-30. Keeping EOL runtimes means shipping a simulation whose CI certifies
  unsupported platforms while the fetch-based tests target modern Node.
- Decision: matrix 22.x (maintenance LTS) and 24.x (active LTS). No failure was hidden:
  the old matrix never reached a green run on ANY version (npm test was an exit-1 stub).
- Reversible: one-line matrix edit.

## D-H4 (2026-10-25) Init and ledger-write semantics hardened

- index.js previously rewrote ledger-data/genesis-block.json on every `npm start`
  (overwrite disguised as success) with a one-off sha256 no verifier checks. Now:
  genesis artefact is written only into an EMPTY ledger dir, hashed with the chain's
  own calculateHash scheme, and LEDGER_DIR is honoured.
- Blockchain constructor auto-creates only the DEFAULT ledger-data dir (fresh-checkout
  convenience). An explicitly configured LEDGER_DIR is never silently created: missing
  config surfaces as 503 on /health and ENOENT on writes instead of self-repairing
  into an empty "healthy" chain.

## D-H5 (2026-10-25) Accepted residual advisories: qs (moderate), elliptic (low)

- npm audit after remediation: 0 critical, 0 high (was 1 critical + 4 high).
- qs moderate (DoS in qs.stringify) is pinned by express@4.22.1's own dependency;
  fixing requires the express 5 major migration - a feature-scale change outside a
  reliability pass (rule 11.1). CI gate is set at --audit-level=high so this is a
  documented, visible acceptance, not a hidden one. Tracked in issue #3 comments.
- elliptic low: no fixed release exists upstream (fixAvailable=false). It is the
  signature primitive of the simulation; severity low; documented here and in issue #3.
- Both re-checked on every CI run; if severity rises to high+, CI goes red by design.

## D-H6 (2026-10-25) Demo scripts moved out of the test namespace

- Root test-*.js files were print-only demos that exited 0 on failure. They were never
  collected by any runner (npm test was a stub), so no test coverage was lost by
  moving them to scripts/demo-*.js with honest exit codes. The real suite (tests/,
  40 assertions-backed tests via node --test) is new. This is a reclassification of
  demos that were mislabelled as tests, not a relocation of failing tests.

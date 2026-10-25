# SILENT_FAILURES.md - grep sweep with dispositions

Repo: humanitarian-coldchain-ledger. Sweep date: 2026-10-25 (sandbox clock, UTC).
Raw output: `docs/qa/artifacts/sweep_raw.md` (note: the raw file matches its own
pattern lines; disregard self-references).

| # | Pattern class | Disposition |
|---|---|---|
| 1 | empty `catch {}`, `.catch(() => {})`, `|| true`, `process.exit(0)` | 0 real hits in product code. One vacuous assertion (`|| true`) existed in tests/shares.test.js from this pass's own drafting - REMOVED (vacuous tests are forbidden; the exact-value assertion lives in the next test). |
| 2 | demo scripts exiting 0 after caught failures | ALL SIX `test-*.js` demo scripts printed "Test Failed"/"Error" and still exited 0 (silent success; verified pre-fix: all five runnable scripts exit 0 unconditionally). FIXED on move to `scripts/demo-*.js`: every `console.error` path now sets `process.exitCode = 1`. demo-asset also enforced its previously print-only signature check, and its broken import (`require(module)` used as constructor - the demo ALWAYS hit the catch) was fixed. |
| 3 | `bin/audit-ledger.js` printed "CHAIN INTEGRITY COMPROMISED" and exited 0 | FIXED: exit code 1 on compromised/missing chain; CI runs it as a gate. |
| 4 | server.js catch blocks (12) | Each returns HTTP 5xx with `success:false` + message (boundary handling, not swallowing: callers can tell). Sampled /ledger and /add-kit; pattern uniform. Disposition: legitimate. |
| 5 | `identity/crypto-util.verifySignature` catch -> console.error + `return false` | Fail-CLOSED default for a verifier (malformed input = not verified). Legitimate; documented here because a false return cannot distinguish "bad signature" from "bad key format" - acceptable for this simulation, noted as backlog. |
| 6 | `Math.random` usage | Only in `scripts/demo-api.js` generating synthetic demo payloads (labelled demo). No randomness in tests or chain logic. |
| 7 | health endpoint probing nothing | FIXED: GET /health now recomputes the full chain (self-hashes + links via contracts/integrity.js) and returns 503 DEGRADED with errors when the ledger is missing/corrupt (regression-tested in tests/api.test.js). |
| 8 | env/config drift | server.js ignored PORT (hardcoded 3000) - FIXED (PORT honoured); LEDGER_DIR added for tests/alternate deployments; Blockchain constructor no longer silently creates an explicitly-configured missing directory (config errors must surface, not self-repair). |
| 9 | overwrite-as-success | index.js rewrote genesis-block.json on every run - FIXED: genesis artefact written only into an empty ledger dir; re-runs skip with a message (docs/DECISIONS.md D-H4). |
| 10 | NaN poisoning | contracts/shares.js computed `profit += payout - transaction.cost` where sell transactions have no `cost` field -> NaN after first sale. Fail-first test captured RED (`profit must be finite, got NaN`), FIXED to net-cash-flow accounting, GREEN captured (docs/qa/artifacts/HCL-006.*). |

## Exit-code propagation summary
- `npm test` -> `node --test tests/` (non-zero on any failing test).
- `npm run audit-ledger` -> non-zero on broken/missing chain.
- demos -> non-zero on caught errors.
- CI has no `continue-on-error`, no `|| true`, no retries on deterministic steps.

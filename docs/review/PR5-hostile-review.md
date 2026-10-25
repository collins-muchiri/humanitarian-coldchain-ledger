# Hostile review: PR #5 (fix/legal-metadata-and-deps)

Reviewer: same operator, hostile-reviewer mode (mission rule 11.2). Date: 2026-10-25.

## Checks performed
1. Forbidden-pattern scan on all added lines: hits are documentation quotes and the
   suppression auditor's own regex literals only. Zero operative suppressions.
2. Silent-success scan on product code (`|| true`, `process.exit(0)`, empty catch):
   zero hits. Every demo script now sets `process.exitCode = 1` on failure paths
   (demo-prediction x3, demo-asset x3 + verify enforcement, demo-crypto, demo-ledger,
   demo-api, demo-validation x2 added during this review).
3. CI: no continue-on-error / allow_failure / retry anywhere; drift guard covers
   worktree AND ledger-data untracked additions.
4. Test-suite integrity: the suite is NEW (40 tests). The removed root `test-*.js`
   were never executed by any runner (npm test was an exit-1 stub; no runner config
   referenced them) and exited 0 even when their own printed checks failed - the
   reclassification to demos is documented as D-H6 with pre-fix evidence
   (HCL-003.*.red.log shows exit 0 on all five runnable scripts).
5. Fail-first chain complete: HCL-005 (race, red 10+/4000 blocks -> green),
   HCL-006 (NaN profit, red -> green), HCL-002 (audit 1 critical+4 high -> 0).
6. Legal scrub verified by case-insensitive sweep: zero ICRC/Red-Cross references
   remain outside the four legal-context documents listed in D-H1.
7. Accepted residual risk (D-H5): qs moderate (express@4 pin), elliptic low (no
   upstream fix) - both visible, gate escalates automatically at high+.

## Verdict
MERGEABLE once CI green. No rule-4 violation found.

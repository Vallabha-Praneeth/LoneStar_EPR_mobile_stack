# Saturday Apr 18, 2026 — Session Log
## PR C: iOS E2E via Maestro Cloud — from "not yet run" to "pipeline wired end-to-end, last bug identified and fixed"

---

## Starting state (resumed from compacted session)

PR C was sitting in draft at commit `caa2c46`:
- Workflow `e2e-ios-maestro-cloud.yml` + `login-smoke.yaml` + `eas.json simulator-e2e` profile committed
- CI validated up to the pre-build step (Checkout / Node / EAS CLI / jq-inject)
- EAS build itself, artifact unpack, and Maestro Cloud run all **unverified** (deferred to save free-tier quota)

Resume instruction: mark PR ready + spend one EAS build to prove the remote side works.

---

## What we did

### 1. First full run — failed on missing `project-id`

- Marked PR #53 ready → no workflow trigger (ready_for_review not in trigger list)
- Triggered manually via `workflow_dispatch`
- Run `24602031378` (14m21s):
  - ✅ EAS build, unpack, download `.app`
  - ❌ Maestro Cloud step: `project-id is required` (mobile-dev-inc/action-maestro-cloud v2 added `project-id` as a required input; warning on unrelated `ios-version` input too)

### 2. Fixed `project-id` + dropped invalid input

- User grabbed Maestro Cloud project ID `proj_01kpfe7jrpfdra4cb8g741j6g3` → added as repo secret `MAESTRO_CLOUD_PROJECT_ID`
- Commit `06be8af`: added `project-id: ${{ secrets.MAESTRO_CLOUD_PROJECT_ID }}`, removed `ios-version: 17` (not a v2 input)
- Run `24602466032`: EAS + unpack ✅, Maestro ❌ — `ENOTDIR: not a directory, scandir '.maestro/driver/login-smoke.yaml'`

### 3. Fixed `workspace` to point at a directory, not a file

- Action's `workspace` input expects a **folder containing Maestro flows**, not a single flow file
- Commit `059666c`: changed `workspace: .maestro/driver/login-smoke.yaml` → `workspace: .maestro` + added `include-tags: smoke` to scope to the single `smoke`-tagged flow
- Run `24604695908` (13m56s): full pipeline ran — EAS ✅, unpack ✅, upload to Maestro Cloud ✅, flow launched on iOS 17 iPhone-11, login-button tapped ❌ — `Assertion is false: id: driver-campaign-screen is visible` (20s timeout)

### 4. Analyzed Maestro Cloud artifacts → found root cause

User downloaded the run's debug artifacts (`hierarchy.json`, `Simulator.log`, `xctest_runner.log`).

`hierarchy.json` at the failure moment showed:
- `username-input` value: **`driver1`** — NOT `driver-e2e`
- `password-input`: 14 dots matching the length of `DriverPass123!`
- Red banner: **"Invalid username or password."**

Maestro had typed the wrong credentials into the login form.

### 5. Researched Maestro env-variable precedence

Web search + Maestro docs confirmed:

> Precedence (highest → lowest):
> 1. Sub-flow header `env:` defaults
> 2. `runFlow`-command `env:` parameter
> 3. Parent flow `env:` header

`../utils/driver-login.yaml` declares dev defaults in its header:
```yaml
env:
  USERNAME: driver1
  PASSWORD: DriverPass123!
```

Those **overrode** `login-smoke.yaml`'s e2e values AND the workflow's `env` input. `runFlow ../utils/driver-login.yaml` → sub-flow used its own defaults → wrong creds typed.

### 6. Fixed by inlining login steps

Commit `e628c59`: inlined `tapOn: username-input` / `inputText: ${USERNAME}` / password / hide-keyboard / `tapOn: login-button` / Not-Now dismissal directly into `login-smoke.yaml`. No sub-flow, no env shadowing. Also bumped final `extendedWaitUntil` from 20s → 30s for Maestro Cloud sim network latency.

Did **not** touch `driver-login.yaml` — still used by dev's `shift-flow.yaml` locally.

New CI run `24605526599` kicked off on push.

---

## Commits on `feat/e2e-ios-maestro-cloud`

| SHA | Change |
|-----|--------|
| `b35ae51` | initial PR C: workflow, eas.json profile, login-smoke.yaml |
| `caa2c46` | patch eas.json at CI time via jq (custom EAS environments need paid plan) |
| `06be8af` | add required `project-id`, drop invalid `ios-version` input |
| `059666c` | `workspace: .maestro` + `include-tags: smoke` (action expects a directory) |
| `e628c59` | **inline login steps** — kill sub-flow env shadowing |

---

## Key learnings (durable)

1. **Maestro sub-flow header env overrides parent.** Any shared util-flow that declares env defaults for dev use will shadow e2e creds if called via `runFlow`. Either inline the caller's logic, or strip the util's header defaults.
2. **`action-maestro-cloud@v2` requires `project-id`** and does NOT accept `ios-version` as an input (warnings only; pinning `ios-version: 17` did nothing but add log noise). Device selection happens Maestro-Cloud-side.
3. **`workspace` input is a directory scan, not a file path.** Use `include-tags` / `exclude-tags` to narrow which flows run.
4. **EAS free-tier iOS build ≈ 10–12 min** on top of ~30s of local CI setup. One build per iteration — keep iterations cheap by fixing YAML/config bugs in one shot, not hunt-and-peck.
5. **`hierarchy.json` from Maestro debug artifacts is the definitive "what was on screen when it failed"** source. Don't spelunk Simulator.log — it's 99% iOS system noise.

---

## State at session end

- Branch `feat/e2e-ios-maestro-cloud` at `e628c59`
- PR #53 open (ready, not draft)
- CI run `24605526599` queued/in-progress — waiting to see if the inline-login fix makes it green
- If green → PR C merges with soft-gate (not required check yet)
- If red → inspect new `hierarchy.json` from Maestro Cloud dashboard to see whatever's next

Plan doc `mobile_e2e_plan.md` PR C section updated with the full CI progression + debug candidates reasoning.

## Next (Sunday Apr 19 or whenever)

1. **If run `24605526599` is green:**
   - Merge PR C (soft-gate, no branch protection change yet)
   - Start PR D (Android E2E via Maestro Cloud — mirror PR C pattern)
2. **If run `24605526599` is red:**
   - Pull new `hierarchy.json` from artifacts
   - Common candidates: 30s still too short for network, `isE2E` launchArg not flipping secureTextEntry (saw this in session — password shown as dots even though isE2E was supposedly true), RPC `get_auth_email_by_username` missing from e2e project, profile fetch fails
3. **Follow-ups (not blockers):**
   - `isE2E` launchArg inspection — the password field showed as secureTextEntry-masked in the hierarchy despite `arguments: { isE2E: 'true' }` passed. Typing still worked, but this is a latent Maestro #1061 risk.
   - Fix driver-login.yaml long term: either remove the `USERNAME: driver1` default or split into `driver-login-dev.yaml` + `driver-login-e2e.yaml`. Today's fix dodges the problem rather than solving it for all callers.

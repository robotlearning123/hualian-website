# Goal: Clone neuralink.com and neuropixels.org (1:1 design study)

## Goal Statement

Produce two independent local Next.js projects under `/home/robot/workspace/40-dong/`
that are visually and structurally faithful 1:1 design clones of their source site
homepages, scaffolded from `JCodesMore/ai-website-cloner-template` and built via
its 5-phase pipeline (Reconnaissance → Foundation → Component Specs → Parallel
Build → Assembly & QA).

- `neuralink-clone/`   — clone of https://neuralink.com/
- `neuropixels-clone/` — clone of https://www.neuropixels.org/

## Scope & Framing

- **Design-study artifact, local only.** Output is a learning/design-reference
  build. Original brand names, logos, and media remain the property of their
  owners — clones are not to be deployed publicly using the source brand identity.
- **Fidelity dimension = design system + structure + interaction + animation.**
- **Source-asset handling:** logos and media are downloaded into
  `public/_reference/` for visual matching during dev; provenance log marks all
  `_reference/` assets as third-party owned and not redistributable.
- **Source snapshots, not live re-fetch.** The recon phase freezes the source's
  DOM, computed styles, and screenshots into `docs/research/snapshots/T0/`. All
  later verifications diff the clone against `T0` snapshots, not the live URL —
  deterministic, reproducible, fast.

## Criteria (17, applied to BOTH clones — goal complete when all 34 verifications pass)

> All commands run from the clone's project root unless noted. `<C>` is
> `neuralink-clone` or `neuropixels-clone`. `$SNAP = ./docs/research/snapshots/T0`.

### Foundation (4)

- [ ] **C1. Scaffolded from template** — verify: `[ -f package.json ] && grep -q '"next": "16' package.json && grep -q '"react": "19' package.json` — pass: exit 0
- [ ] **C2. Dependencies install clean** — verify: `npm install` — pass: exit 0
- [ ] **C3. Production build succeeds** — verify: `npm run build` — pass: exit 0
- [ ] **C4. TypeScript strict + lint pass** — verify: `npx tsc --noEmit && npm run lint` — pass: exit 0

### Runtime (2)

- [ ] **C5. Dev server returns HTTP 200 at `/`** — verify: `npm run dev & DEV_PID=$!; trap "kill $DEV_PID 2>/dev/null" EXIT; npx wait-on http://localhost:3000 -t 60000 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` — pass: `200`
- [ ] **C6. Zero console errors on home load** — verify: `node ../scripts/qa/console-errors.js http://localhost:3000/` — pass: error count `== 0`

### Design tokens (3) — diff against `$SNAP/tokens.json`

- [ ] **C7. Color tokens match (oklch component-wise)** — verify: `node ../scripts/qa/diff-tokens.js --kind color --snapshot $SNAP --clone http://localhost:3000/` — pass: per token `|ΔL| ≤ 0.02 ∧ |ΔC| ≤ 0.02 ∧ |ΔH| ≤ 5°`
- [ ] **C8. Typography tokens match** — verify: `node ../scripts/qa/diff-tokens.js --kind typography --snapshot $SNAP --clone http://localhost:3000/` — pass: family/size/weight/line-height match per role (body, h1–h6, button, caption, nav-link)
- [ ] **C9. Spacing tokens match** — verify: `node ../scripts/qa/diff-tokens.js --kind spacing --snapshot $SNAP --clone http://localhost:3000/` — pass: per-section padding/gap deltas `≤ 2px`

### Structure (3) — diff against `$SNAP/structure.json`

- [ ] **C10. Section count + order matches** — verify: `node ../scripts/qa/diff-structure.js --section-order --snapshot $SNAP --clone http://localhost:3000/` — pass: ordered section signature identical (signature spec below)
- [ ] **C11. Navigation parity** — verify: `node ../scripts/qa/diff-structure.js --nav --snapshot $SNAP --clone http://localhost:3000/` — pass: nav link labels + count + href slugs identical
- [ ] **C12. Footer parity** — verify: `node ../scripts/qa/diff-structure.js --footer --snapshot $SNAP --clone http://localhost:3000/` — pass: footer link labels + count identical

### Visual fidelity (4) — diff against `$SNAP/screenshots/*.png`, threshold = noise_floor + budget

- [ ] **C13. Desktop visual diff (1920×1080) — animations frozen** — verify: `node ../scripts/qa/visual-diff.js --vp 1920x1080 --scrolls 0,0.33,0.66,1.0 --freeze-animations --snapshot $SNAP --clone http://localhost:3000/` — pass: pixelmatch diff `≤ noise_floor_desktop + 3%` per scroll position (noise floor measured in A3, written to `40-dong/scripts/qa/noise-floor.json`)
- [ ] **C14. Mobile visual diff (375×812) — animations frozen** — verify: `node ../scripts/qa/visual-diff.js --vp 375x812 --scrolls 0,0.5,1.0 --freeze-animations --snapshot $SNAP --clone http://localhost:3000/` — pass: pixelmatch diff `≤ noise_floor_mobile + 5%` per scroll position
- [ ] **C15. Hover-state diff** — verify: `node ../scripts/qa/visual-diff.js --hover nav-links,cta-primary,cta-secondary,card-primary --snapshot $SNAP --clone http://localhost:3000/` — pass: pixelmatch diff `≤ noise_floor_hover + 2%` per element
- [ ] **C17. Animation/scroll-trigger diff** — verify: `node ../scripts/qa/visual-diff.js --animation-trail --sections all --settle-ms 1500 --snapshot $SNAP --clone http://localhost:3000/` — pass: pixelmatch diff `≤ noise_floor_animation + 4%` per scroll-trigger point. Procedure: scroll each section's trigger into view, wait `settle-ms` for transitions to end (or `transitionend` event), capture, diff against snapshot taken with same procedure on source.

### Handoff (2)

- [ ] **C16. Research artifacts present** — verify: `[ -d docs/research/screenshots ] && [ -f docs/research/component-specs.md ] && [ -f docs/research/design-tokens.json ] && [ -d docs/research/snapshots/T0 ] && [ -f README.md ]` — pass: exit 0
- [ ] **C18. README has required sections** — verify: `grep -q '^## Source' README.md && grep -q '^## Disclaimer' README.md && grep -q '^## How to run' README.md && grep -q '^## Provenance' README.md` — pass: exit 0

> Numbering note: C16 + C17 + C18 = 3 handoff/visual additions; total criteria = 17 (renumbered if needed in run-all output, but criteria-set semantics are stable).

## Selector Strategy (for B2 token extraction & C7-C9 diff)

Deterministic, snapshot once per source — written to `docs/research/snapshots/T0/selectors.json`.

| Role | Selector (first non-empty match wins) |
|------|---------------------------------------|
| Primary heading | `main h1, [role=banner] h1, header h1, h1` |
| Subheading | `main h2, header h2, h2` |
| Body text | `main p:not(nav p):not(footer p)` (sample: longest by text length) |
| Nav link | `nav a:not([aria-hidden=true])` (sample: first 3, take consensus) |
| Footer link | `footer a` (sample: first 3, take consensus) |
| Button primary | `button[type=submit], .btn-primary, [class*="primary"][role=button], main a.cta` (first) |
| Card | `article, [class*="card"]:not(nav *)` (first in main) |
| Background (page) | `body` (`background-color`) |
| Background (section) | each `<section>, main > div` |
| Brand color | derived: most-frequent non-neutral foreground from above 8 roles |

Body color tokens are stored in **oklch** (Tailwind v4 native). Conversion at extraction time uses `culori`.

## Section Signature Spec (for C10)

For each top-level section, signature is the ordered tuple:
```
{
  tag,              // e.g. "section", "div", "main"
  role,             // ARIA role or aria-label, normalized lowercase, "" if absent
  headingText,      // first descendant h1/h2/h3 text, sliced [0:30], lowercased
  childCount        // direct children at depth 1
}
```
Section order signature = ordered list of these tuples top-to-bottom in the document. C10 passes when the source signature list deep-equals the clone signature list.

Sections are identified by: `body > *:not(script):not(style)` flattened to top-level visual blocks (collapsing wrapper divs that have only a single child).

## Sub-Tasks (ordered, with dependencies)

### Phase A — Setup (sequential)
1. **A1.** `git clone` template into `40-dong/neuralink-clone/` and `40-dong/neuropixels-clone/`. Complexity: T. Depends: none.
2. **A2.** `npm install` in both. Verify Node 20+, `claude-in-chrome` MCP, `gstack/browse`. Complexity: T. Depends: A1.
3. **A3.** Author `40-dong/scripts/qa/` shared harness:
   - `visual-diff.js` (pixelmatch + animation-freeze + scroll trail + hover)
   - `diff-tokens.js` (color oklch component-wise / typography / spacing)
   - `diff-structure.js` (section signature / nav / footer)
   - `console-errors.js`
   - `extract-snapshot.js` (recon helper that produces `docs/research/snapshots/T0/`)
   - `measure-noise-floor.js` (capture source URL twice → pixelmatch → write `40-dong/scripts/qa/noise-floor.json` per site/viewport)
   - `run-all.sh` (executes all 17 criteria for both clones, prints `34/34 PASS`)
   Complexity: C. Depends: A2.

### Phase B — Reconnaissance (per clone, parallel between clones; 1 subagent each)
4. **B-NL.** Recon agent for neuralink: capture screenshots @ 1920×1080 + 375×812 at scrolls [0, 0.33, 0.66, 1.0] + animation-trail captures + hover captures; extract tokens + structure to `docs/research/snapshots/T0/`; download referenced assets to `public/_reference/` with provenance log; write `docs/research/component-specs.md`. Complexity: C. Depends: A3.
5. **B-NP.** Same for neuropixels. Depends: A3.

### Phase C — Foundation (per clone, can be parallel)
6. **C-NL.** Apply tokens to `tailwind.config.ts` + `app/globals.css` (oklch palette, font stack, spacing scale, radii, shadows). Wire `next/font`. Complexity: M. Depends: B-NL.
7. **C-NP.** Same. Depends: B-NP.

### Phase D — Build (per clone; 1 build-orchestrator subagent each, internal section loop)
8. **D-NL.** Build orchestrator implements `<Header/>`, `<Footer/>`, sections, composes `app/page.tsx`, wires interactions (scroll/hover/intersection-observer/animation triggers). Complexity: C. Depends: C-NL.
9. **D-NP.** Same. Depends: C-NP.

### Phase E — QA Loop (per clone, sequential within clone; 1 fixer subagent reused via SendMessage)
10. **E-NL.** Run `scripts/qa/run-all.sh --filter neuralink-clone`. For each failing criterion, send fix instructions to fixer subagent (with diff output, criterion ID, target files). Re-verify. Loop. Complexity: C. Depends: D-NL.
11. **E-NP.** Same. Depends: D-NP.

### Phase F — Final
12. **F.** Final clean re-run of `run-all.sh` from a fresh shell, expect `34/34 PASS`. Write top-level `40-dong/README.md` summarizing both clones, provenance, criteria pass-state, run instructions. Complexity: T. Depends: E-NL, E-NP.

## Subagent Budget Plan (cap = 20/session, target ≤ 12)

| Phase | Subagent | Count | Reuse strategy |
|-------|----------|-------|----------------|
| B | recon-NL | 1 | single dispatch, one agent does all of B-NL |
| B | recon-NP | 1 | single dispatch |
| D | build-orch-NL | 1 | named agent; section work happens within its turn loop |
| D | build-orch-NP | 1 | same |
| E | fixer-NL | 1 + up to 5 SendMessage rounds | re-dispatched only if agent crashes |
| E | fixer-NP | 1 + up to 5 SendMessage rounds | same |
| **Total dispatches** | | **6 base + ≤ 6 re-dispatches = ≤ 12** | |

If a phase needs to spawn additional helpers (e.g., asset downloader), they batch into the named agent's turn — no separate dispatch.

## Max-Attempts Escape Rule (codified)

For any single criterion in Phase E: **3 strikes → escalate**.

```
attempts = 0
while criterion fails:
    attempts += 1
    if attempts > 3:
        TaskCreate("Escalation: <criterion> stuck after 3 attempts")
        dump diff output, fixer's last log, modified files list
        pause loop, await user input
        break
    SendMessage(fixer, criterion, diff_output, target_files)
    re-verify
```

This applies per-criterion; not "3 strikes total". Other criteria continue progressing.

## Baseline (before any changes — 2026-05-01)

- Workspace: `/home/robot/workspace/40-dong/` empty except `docs/`, `.omx/`, `output/`, `AGENTS.md`.
- Neither clone exists. **All 34 verifications fail** at baseline (clones absent).
- Tooling: Node + npm available (to verify in A2); `claude-in-chrome` MCP available; `gstack/browse` available for headless QA.
- Template repo not yet cloned locally.
- Noise floor not yet measured (set in A3).

## Risk Areas

1. **Neuralink animation/3D fidelity** — full-bleed video + parallax + possibly WebGL. **Mitigation:** C13/14 use `--freeze-animations` (pause `<video>`, `transform: none`, `animation-play-state: paused` via injected stylesheet) so static layout is verified independently; C17 verifies the *animation behavior itself* against source's same-procedure capture, with noise-floor accounting.
2. **`/clone-website` slash command not in this session** — **Mitigation:** the template still gives us project scaffolding/conventions, but the 5-phase pipeline runs via our own A3 harness + B/D/E subagent dispatch.
3. **Asset licensing** — **Mitigation:** `public/_reference/` provenance log; clones marked design-study, local-dev only in README (C18 enforces this).
4. **Token-extraction noise** — **Mitigation:** deterministic Selector Strategy table above.
5. **Subagent budget** — **Mitigation:** Subagent Budget Plan table above keeps us at ≤ 12 of 20.
6. **Stuck criterion (especially C13/C17 on Neuralink)** — **Mitigation:** Max-Attempts Escape Rule above; user gets diagnostic dump rather than infinite loop.
7. **Source page mutates during recon** — **Mitigation:** snapshot freeze in B (single visit, all data captured atomically); all later diffs against snapshot, never live URL.

## Verification Commands Index (run-all.sh executes in order)

| ID | Command (run from clone root unless noted) |
|----|--------------------------------------------|
| C1 | `[ -f package.json ] && grep -q '"next": "16' package.json && grep -q '"react": "19' package.json` |
| C2 | `npm install` |
| C3 | `npm run build` |
| C4 | `npx tsc --noEmit && npm run lint` |
| C5 | `npm run dev & DEV_PID=$!; trap "kill $DEV_PID 2>/dev/null" EXIT; npx wait-on http://localhost:3000 -t 60000 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` |
| C6 | `node ../scripts/qa/console-errors.js http://localhost:3000/` |
| C7-C9 | `node ../scripts/qa/diff-tokens.js --kind {color\|typography\|spacing} --snapshot $SNAP --clone http://localhost:3000/` |
| C10-C12 | `node ../scripts/qa/diff-structure.js {--section-order\|--nav\|--footer} --snapshot $SNAP --clone http://localhost:3000/` |
| C13 | `node ../scripts/qa/visual-diff.js --vp 1920x1080 --scrolls 0,0.33,0.66,1.0 --freeze-animations --snapshot $SNAP --clone http://localhost:3000/` |
| C14 | `node ../scripts/qa/visual-diff.js --vp 375x812 --scrolls 0,0.5,1.0 --freeze-animations --snapshot $SNAP --clone http://localhost:3000/` |
| C15 | `node ../scripts/qa/visual-diff.js --hover nav-links,cta-primary,cta-secondary,card-primary --snapshot $SNAP --clone http://localhost:3000/` |
| C16 | `[ -d docs/research/screenshots ] && [ -f docs/research/component-specs.md ] && [ -f docs/research/design-tokens.json ] && [ -d docs/research/snapshots/T0 ] && [ -f README.md ]` |
| C17 | `node ../scripts/qa/visual-diff.js --animation-trail --sections all --settle-ms 1500 --snapshot $SNAP --clone http://localhost:3000/` |
| C18 | `grep -q '^## Source' README.md && grep -q '^## Disclaimer' README.md && grep -q '^## How to run' README.md && grep -q '^## Provenance' README.md` |

## Definition of Done

When `bash 40-dong/scripts/qa/run-all.sh` (which executes C1–C18 for both clones in
sequence) exits 0 AND prints `34/34 PASS`, the goal is complete.

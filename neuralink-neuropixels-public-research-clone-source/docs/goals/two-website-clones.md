# Goal: Clone Neuralink and Neuropixels visible landing pages

## Criteria
- [x] Neuralink visible landing page is cloned locally at `neuralink.html` — verify: `test -f neuralink.html && rg "From neural signals to life-changing impact|Pioneers Wanted" neuralink.html`
- [x] Neuropixels visible landing page is cloned locally at `neuropixels.html` — verify: `test -f neuropixels.html && rg "Neuropixels Probes|Neuropixels Software|A new era in electrophysiology" neuropixels.html`
- [x] Shared static scaffold exists without adding framework dependencies — verify: `test -f index.html && test -f styles/base.css && test -f scripts/site.js && ! test -f package.json`
- [x] Local asset references resolve — verify: `node scripts/check-static.mjs`
- [x] Both pages serve locally — verify: `python3 -m http.server 3456` plus browser navigation to `/neuralink.html` and `/neuropixels.html`
- [x] Desktop and mobile reference screenshots exist for both targets — verify: `test -s output/playwright/neuralink-desktop-reference.png && test -s output/playwright/neuralink-mobile-reference.png && test -s output/playwright/neuropixels-desktop-reference.png && test -s output/playwright/neuropixels-mobile-reference.png`
- [x] Desktop and mobile clone screenshots exist for both targets — verify: `test -s output/playwright/neuralink-desktop-clone.png && test -s output/playwright/neuralink-mobile-clone.png && test -s output/playwright/neuropixels-desktop-clone.png && test -s output/playwright/neuropixels-mobile-clone.png`
- [x] Key interactions pass — verify: browser spot checks for Neuralink cookie/promo dismissal and Neuropixels dropdown/skip-link behavior
- [x] Visual fidelity is evaluated and iterated — verify: `.omx/state/web-clone/verdicts.json` includes per-page desktop/mobile verdict records and remaining differences, if any

## Top-Level Goal Audit
- Goal statement: Clone the visible landing pages for `https://neuralink.com/` and `https://www.neuropixels.org/` in `/home/robot/workspace/40-dong` with high visual fidelity and verify them with local browser screenshots and narrow build/serve checks.
- Goal achieved: [ ] no / [x] yes
- Missing proof:
  - None for the static visual-clone scope.

## Milestones
- [x] M1: Reference extraction is complete — verify: screenshots and `.omx/state/web-clone/extraction.json` exist with source assets and page structure
- [x] M2: Static clone implementation is complete — verify: HTML/CSS/JS/assets exist and `node scripts/check-static.mjs` passes
- [x] M3: Browser verification is complete — verify: local server screenshots, interaction checks, and visual verdict records exist
- [x] M4: Completion audit passes — verify: every criterion above has concrete evidence

## Sub-Tasks (ordered)
1. Capture reference screenshots and extraction JSON — milestone: M1 — complexity: moderate — depends on: none
2. Create static scaffold and checker — milestone: M2 — complexity: moderate — depends on: 1
3. Download and normalize visible assets — milestone: M2 — complexity: moderate — depends on: 1
4. Implement Neuralink clone — milestone: M2 — complexity: complex — depends on: 2, 3
5. Implement Neuropixels clone — milestone: M2 — complexity: complex — depends on: 2, 3
6. Serve locally and capture clone screenshots — milestone: M3 — complexity: moderate — depends on: 4, 5
7. Run structure, interaction, and visual verification; iterate mismatches — milestone: M3 — complexity: complex — depends on: 6
8. Perform final completion audit — milestone: M4 — complexity: moderate — depends on: 7

## Baseline (before clone implementation)
- Neuralink local clone: FAIL (`neuralink.html` missing)
- Neuropixels local clone: FAIL (`neuropixels.html` missing)
- Static scaffold: FAIL (`index.html`, CSS, JS, and checker missing)
- Local asset references: FAIL (`scripts/check-static.mjs` missing)
- Reference screenshots: PASS for four target screenshots captured in `output/playwright/`
- Clone screenshots: FAIL (clone pages missing)
- Interactions: FAIL (clone pages missing)
- Visual verdicts: FAIL (`.omx/state/web-clone/verdicts.json` missing)

## Risk Areas
- Neuralink uses dynamic video/media and cookie state; reference screenshots must preserve the same visible first-run state used by the clone.
- Neuropixels is a Wix-rendered page; exact fonts and image crops may need measured CSS and iterative screenshot comparison.
- The user requested "1:1 same"; browser rendering, fonts, and copyrighted remote assets can block absolute pixel identity, so the work must report any remaining measured differences honestly.
- This workspace is not a git repository, so branch/worktree isolation and commits are not available.

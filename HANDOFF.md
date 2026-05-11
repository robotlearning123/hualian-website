# Session handoff — 2026-05-11

## State at session end

- **Branch:** `main` (clean working tree)
- **HEAD:** `6ebf1ec` — FIX-031 cross-model review followup
- **Origin:** pushed
- **Live:** https://huanlian-site.pages.dev (deploy `1b4b8328`)
- **Uncommitted:** none

## What shipped this session (in order)

| Commit | FIX | One-liner |
|---|---|---|
| `a43c31f` | chore | pre-feedback product manual PDF + tagline draft |
| `5642565` | FIX-023 | brand rename 96 occurrences (星脑智联 / AstroMind → 幻联科技 / Huanlian Tech) |
| `5965f36` | FIX-024 | nav rename + reorder + home hero rewrite + 6 capsule eyebrows + pipeline labels |
| `2155206` | FIX-025 | capsule eyebrow CSS + 22% dim + button hover |
| `782f102` | ops | PDF compress 46 MB → 6.6 MB (CF Pages 25 MB cap) |
| `7858572` | FIX-026 | DEMO capsule + metric3 i18n |
| `5aa5769` | FIX-027 | home section reorder per feedback narrative |
| `a1b8d75` | FIX-028 | nav 76px + 16px font + H1 to 150px |
| `9187197` | FIX-028 followup | home `.hero-lede` override too (specificity cascade) |
| `423e163` | FIX-029 | 3 new image+video pairs (hero, brain, cleanroom) + footer PDF swap |
| `bfed082` | FIX-030 | close 10 remaining spec drifts verbatim (button styling, metric 48-60px, cinematic 72-96/20-24, page 3 wording, hero lede, dim 25%, nav #ccc) |
| `6ebf1ec` | FIX-031 | cross-model review followup: delete design-iterations leak, dim 0.20→0.25, button floor 16→18, lede floor 24→28 |

## Verified live (Chrome MCP, 2026-05-11 final deploy)

- Brand: `幻联科技` (zh), `Huanlian Tech` (en)
- Capsules: `MICHIGAN·植入`, `NEUROBOX·采集`, `NEUROANALYSIS·解码`, `CLEANROOM·微纳加工`, `DEMO·产品演示`, `REHAB·康复`
- Pipeline 4-step: `MICHIGAN·植入界面` / `NEUROBOX·采集与定位` / `NEUROANALYSIS·信号解析` / `REHAB·临床康复`
- Hero H1 150px, lede 44px, eyebrow 22px sentence-case
- Button 22px font, primary white+jade-border, secondary transparent+white-border
- Metric value 60px (no dividers), label 16px
- Cinematic H2 96px, body 24px, dim 25%
- Nav 76px, 16px text, #cccccc inactive, jade+2px underline active
- Footer PDF → `huanlian-product-manual.pdf` (6.6 MB), label `产品手册 PDF`
- i18n: 0 Chinese leaks in EN mode, FOUL gate works (`html.i18n-ready` on load)

## Deferred (杨总 / Yang Dong decision)

1. **Logo redesign** — `assets/images/logo.jpg` still carries the old `星脑智联` graphic. Spec line [29] said "（杨总回答）" pending. Text purge is complete; only the bitmap remains.
2. **Brand color** — spec suggested `#3DDC84`, current jade is `#7ee4bd`. Spec line [12] said "等 logo 设计完成再统一" so defer with the logo.

## Tomorrow / next session priorities

1. **Wait for Yang Dong on logo + brand color** before touching colors. Do not pre-empt.
2. **Re-run codex review** when spark quota resets (2026-05-12 ~10:18) for a true cross-model second opinion. Command (from `~/.claude/skills/codex/SKILL.md` review mode):
   ```bash
   cd /home/robot/workspace/40-dong/huanlian-site
   cat /tmp/codex-prompt-short.txt | codex exec - --dangerously-bypass-approvals-and-sandbox \
     -C "$(git rev-parse --show-toplevel)" -c 'model_reasoning_effort="high"' \
     2>&1 > /tmp/codex-review-output.txt
   ```
3. **Asset replacement decisions** — Yang Dong may want to swap the 3 new generated images for real photos. Old assets remain in `assets/` (just deprecated in manifest); new ones are `*-v2.{png,mp4}`. To swap back: change `<video src>` and `poster` in `index.html` lines 99, 144, 181 plus OG/Twitter meta.
4. **Optional** — apps/partners/contact/shop pages still inherit FIX-024+028+030 styles but their hero h1s are 4-char Chinese. If feedback wants larger hero typography there too, mirror the home-page CSS overrides.
5. **Optional / never blocked** — the demo video (`assets/media/demo-video.mp4`) is client-supplied; spec line [9] says "≤30s". Not yet timing-verified.

## Tools / credentials

- All op:// paths in `lang/../HANDOFF.md` deferred — see `~/.claude/projects/-home-robot-workspace-40-dong/memory/reference_huanlian_site.md`.
- Deploy command in same reference file.
- FAL key in `op://Dev/1Key - FAL_KEY/password` for asset regen.
- Branch guard hook blocks direct `git commit` on `main`; workflow is feature-branch → ff-merge.

## Files updated this session (all committed)

- `index.html` (massive — hero rewrite + capsule + section reorder + new asset refs)
- `apps.html`, `contact.html`, `partners.html`, `platform.html`, `shop.html`, `technology.html` (nav + footer)
- `styles/huanlian.css` (button, capsule, metric, cinematic, hero, nav, dim)
- `scripts/i18n.js` (FOUL gate `revealReady()`)
- `lang/zh.json` + `lang/en.json` (~80 keys added/changed)
- `CHANGELOG.md`, `PROMPTS.md`, `README.md`, `DESIGN.md`, `CONTENT_SOURCE.md`, `lang/README.md`
- `assets-manifest.json` (batch 6 entries)
- `assets/images/{hero-implant,neural-waves,electrode-fab}-v2.png`
- `assets/media/{hero-loop,neural-waves-loop,electrode-fab-loop}-v2.mp4`
- `assets/docs/huanlian-product-manual.pdf` (6.6 MB compressed)
- `.fal-tracking/runs/20260511T134051Z/*.json` (audit trail)

## Files deleted (recoverable from git history)

- `design-iterations/{claude-v1,stitch-v1}/*` — old design drafts containing legacy `星脑智联` branding
- `assets/docs/huanlian-product-manual-2026-04.pdf` and `-full.pdf` (46 MB + 49 MB originals) — moved to `../huanlian/_originals-*.pdf` for archive

# Changelog

All notable changes to the Huanlian BCI website. Newest first.

## 2026-05-09

### Reproducibility
- `assets-manifest.json` — single source of truth for every generated asset, with full prompt + model + params
- `scripts/regenerate-assets.sh` — re-creates every asset from the manifest (idempotent, supports `--batch=` and `--kind=` filters)
- `.fal-tracking/initial-runs/` — original fal.ai submission JSONs (request_id / response_url) for audit
- `PROMPTS.md` — human-readable prompt log (mirrors manifest)

### Site
- All 4 pages (home, technology, platform, shop) now driven by `data-i18n` attributes; `scripts/i18n.js` swaps between `lang/zh.json` and `lang/en.json`. Toggle button (CN ↔ EN) lives in the top-right of every page.
- Hero on home: lighter overlay (only top/bottom fades), H1 reduced 168→116px, copy moved to bottom 40% so the seedance video reads through clearly.
- Real client `huanlian/logo.jpg` wired into header brand-mark; SVG arrow moved to legacy class.
- Real client `huanlian/demo-video.mp4` placed in a dedicated `.demo-band` between Pipeline and Launch on home.
- Cinematic 3 (Rehab) on home: static `rehab-exo.png` → `rehab-motion.mp4` (image → video promotion).
- Technology stack rebuilt as alternating 50/50 left-right rows; stack-index nested inside stack-body for proper 2-col grid; large media (clamp 280-460px tall).
- Page-unique fal.ai assets (batch 4) ended cross-page repetition: `tech-hero` / `tech-acquisition` / `tech-targeting` / `tech-clinic-1` / `tech-clinic-2` / `tech-software-loop.mp4` / `platform-hero-loop.mp4` / `rehab-motion.mp4`.
- Batch 5 in flight: 15 images + 6 videos for further variety (cleanroom, surgical-hands, brain-holo, monitoring-station, cable-rack, optogenetic, etc.).

### Repo
- GitHub repo renamed `hualian-website` → `huanlian-website` (correct spelling matching the brand mark)
- Cloudflare Pages: new project `huanlian-site` at `https://huanlian-site.pages.dev/`
- GitHub Pages mirror at `https://robotlearning123.github.io/huanlian-website/`

### Design (Gemini round-1 review applied)
- Header: starting opacity 0.6 → 0.78 + always-on backdrop blur (was unreadable on hero video brights)
- Mono fonts standardized for `brand-subtitle` / `metric-label` / `capability-kicker`
- Section transition: 120px feather gradient on `.media-band` top/bottom edges
- Scroll cue: bottom-left placement, hidden on short viewports
- AI-slop score reported by Gemini: 3/10 (down from baseline)

## 2026-05-08

- Initial Huanlian website template extracted from doc and bilingual mash placeholder
- 4 pages built; `huanlian-site/` directory under workspace `40-dong`

## Workflow notes

- Each `git push origin main` redeploys both GitHub Pages and Cloudflare Pages (CF Pages is wired via the `huanlian-site` project, deployed manually via `wrangler pages deploy . --project-name=huanlian-site` until git integration is configured in CF dashboard).
- Asset reproduction: `cd huanlian-site && ./scripts/regenerate-assets.sh` (or `--batch=batch5` for a specific subset). Tracking JSON for every run is written to `.fal-tracking/runs/<timestamp>/`.
- Prompt edits: change the prompt in `assets-manifest.json` and re-run the regenerate script with `--force` for the affected batch/file.

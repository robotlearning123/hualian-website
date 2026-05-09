# Changelog

All notable changes to the Huanlian BCI website. Newest first.

## 2026-05-09 — best-quality polish pass (FIX-006..009)

- **FIX-006** `a11y` — semantic `<figure>` for 16 product thumbs in shop (`c95028a`)
- **FIX-007** `perf` — hover-to-play for 5 shop product card videos; cinematic banners stay autoplay-in-viewport (`3b063e0`)
- **FIX-008** `style` — alternate cinematic banner alignment (bottom-left ↔ bottom-right) on home to break visual rhythm (`b527a14`)
- **FIX-009** `feat` — SEO / a11y / perf polish bundle (`8c1c624`)
  - favicon.svg + favicon.jpg, robots.txt, sitemap.xml with hreflang
  - canonical / OG / Twitter card / theme-color on all 4 pages
  - JSON-LD Organization schema on home (name, alternateName, address, tel, email)
  - Skip-to-content link → `<main id='main-content'>` on every page
  - `:focus-visible` 2px jade outline; `::selection` jade highlight
  - `text-wrap: balance` on H1/H2/H3; `pretty` on p
  - `color-scheme: dark`, `text-rendering: optimizeLegibility`, font smoothing
  - `font-variant-numeric: tabular-nums` on `.metric-value`

## 2026-05-09 — design-review fix pass (5 commits)

After running `/design-review` against the live site (https://huanlian-site.pages.dev/),
applied 5 atomic fixes:

- **FIX-001** `style(a11y)` — touch targets ≥44px + unified H2 scale (`f5baecd`)
  - `.primary-nav a`: min-height 44 + padding 8/12 (was 28×36 hit area)
  - `.lang-switch`: min 44×44 + button defaults
  - h2 base: clamp(30,4.4vw,56) — was clamp(32,5vw,68)
  - `.cinematic-band h2`: clamp(36,5.5vw,72) — was clamp(40,7vw,96)
  - Two-tier scale (56 / 72) replaces 3-tier 68/96 jumble.
- **FIX-002** `perf` — lazy autoplay for looping videos via IntersectionObserver (`65b46c6`)
  - Strips `autoplay` from all `<video autoplay muted loop>`; preload=metadata
  - Plays only when ≥15% in viewport; pauses on exit
  - Saves ~70 MB initial autoplay across home page on phones.
- **FIX-003** `ux` — differentiate 16 shop card buttons (`19cca4c`)
  - Replaced generic '咨询' with verb+product labels: 询价 SpikeLink / ECoG /
    NeuroBox / Michigan / Microwire / MPM / Headstage / VR / HD-MEA;
    申请软件演示 (NeuroAnalysis); 咨询康复方案 / 康复机器人 / TI 方案;
    了解脑电帽 / 情绪分析 / BCI 眼镜.
- **FIX-004** `feat(tech)` — figcaptions on all 4 stack figures + final CTA (`7119516`)
  - `.stack-caption` mono 12px steel-gray over gradient overlay
  - New contact-band CTA at bottom of /technology with mailto + link to /platform
  - i18n keys `tech.cta.*` added in zh/en
- **FIX-005** `a11y` — restore figcaptions on home + platform launch videos (`caadb44`)
  - 联盟发布主题分享 / Alliance Launch Keynote
  - i18n keys `home.launch.cap1` / `platform.launch.cap2`

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

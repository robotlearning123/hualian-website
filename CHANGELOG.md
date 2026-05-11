# Changelog

All notable changes to the Huanlian Technology website. Newest first.

## 2026-05-11 — replace 3 image+video pairs per feedback (FIX-029)

- **FIX-029a** `feat(asset)` — three on-brand replacements generated via
  fal-ai/gpt-image-2 (image) + fal-ai/bytedance/seedance/v1/pro (video):
  - **Hero** (`hero-implant-v2.png` + `hero-loop-v2.mp4`) — the original
    hero showed a patient-monitor-style background panel that the
    feedback called "和脑机接口产品调性不匹配". The v2 keeps the
    silicon probe + gold contact pads in the foreground but the BG is
    now a clean out-of-focus neuroscience workbench, not a generic
    medical monitor.
  - **NEUROANALYSIS banner** (`neural-waves-v2.png` +
    `neural-waves-loop-v2.mp4`) — replaces the previous brain hologram
    which the feedback flagged as anatomically inaccurate (神经/血管
    混淆). The v2 is an abstract multi-channel waveform visualization
    with a faint wireframe brain silhouette; scientifically defensible
    rather than a beauty render.
  - **CLEANROOM banner** (`electrode-fab-v2.png` +
    `electrode-fab-loop-v2.mp4`) — the previous cleanroom video read
    as a generic semiconductor fab; feedback wanted "电极/探针制造
    专属工艺". The v2 is an ultra-macro of a silicon neural probe
    under high magnification, with a cleanroom workstation barely
    visible behind.
  Six prompts, manifest entries and audit JSONs stored in
  `assets-manifest.json#generated.batch6`, `PROMPTS.md` "Batch 6", and
  `.fal-tracking/runs/20260511T134051Z/`. Old assets remain on disk
  for archive but are marked `deprecated` in the manifest.
- **FIX-029b** `fix(footer)` — per user instruction "发布资料 PDF
  should be the company/product pdf, not the current ppt", footer link
  on all 7 pages now points at `assets/docs/huanlian-product-manual.pdf`
  (the 6.6 MB compressed product manual from FIX-022.5) instead of the
  Anhui BCI Alliance launch PPT. Label retitled `产品手册 PDF` /
  `Product Manual PDF`.

## 2026-05-11 — nav + hero typography per feedback spec (FIX-028)

- **FIX-028a** `style(nav)` — feedback's nav spec applied:
  - `--header-height` 72 → 76px (feedback range 60–80)
  - `.primary-nav` font 14 → 16px
  - Active item gains jade color + 2px underline (was 1px, hidden by
    default). Hover lightens text to bone.
  - Underline inset by 12px each side so it spans the link text, not
    the padding.
- **FIX-028b** `style(hero)` — home H1 font-size clamp 58–116 → 72–150
  (per feedback "120–150px on desktop"). Hero eyebrow on home only
  switched from uppercase 12px tag to sentence-case 15–22px subtitle
  (the company tagline reads as a real headline now, not a tag).
  Hero lede 18–24 → 20–30px ("1/3–1/4 of H1").

## 2026-05-11 — home narrative reorder (FIX-027)

- **FIX-027** `feat(home)` — section order reshuffled to match the
  feedback's 11-page narrative: build trust by showing products first,
  then company. Final order on index.html:
  1. hero
  2. MICHIGAN cinematic
  3. NEUROBOX cinematic
  4. NEUROANALYSIS cinematic ← moved up from pos 9
  5. FULL STACK pipeline
  6. CLEANROOM cinematic
  7. Demo
  8. 关于我们 (intro)         ← moved down from pos 3
  9. media-band (产品发布)
  10. REHAB cinematic
  11. teaser cards

  Reason from the feedback: "用户了解产品后，再介绍公司背景，更容易建立信任".
  Cinematic alignments left as-is; some adjacent banners now share
  data-align but visual rhythm still reads clean against the dim
  overlay (FIX-025).

## 2026-05-11 — Demo capsule + metric3 value i18n (FIX-026)

- **FIX-026a** Demo banner eyebrow `Demo · 产品演示` → `DEMO · 产品演示`
  (capital `DEMO` to match the MICHIGAN / NEUROBOX / NEUROANALYSIS /
  CLEANROOM / REHAB capsule pattern). EN dict: `DEMO · Product`.
- **FIX-026b** Third hero-proof metric-value "全周期" was hardcoded —
  in EN mode it stayed Chinese. Bound to new key
  `home.hero.metric3value` (zh = 全周期, en = End-to-end).

## 2026-05-11 — visual rules: capsule label + dim overlay + button hover (FIX-025)

- **FIX-025a** `style(eyebrow)` — `.cinematic-eyebrow` upgraded to the
  feedback's "capsule" spec: padding 8×16, font 13px, jade-tinted 1px
  border, deeper near-black bg (`rgba(16,18,16,0.86)`), backdrop blur
  for readability over video. Selector extended to `.demo-band` so the
  Demo banner matches.
- **FIX-025b** `style(overlay)` — added a uniform 20–22% dim layer to
  `.hero-overlay` and `.cinematic-band::after` (on top of the existing
  directional gradient). Per feedback: "background images need a
  20–25% dim overlay so the headline stays readable." Previously the
  middle of the hero had 0 dim — the spot where the H1 sits.
- **FIX-025c** `style(button)` — hover state strengthened. translateY
  goes -1→-2px, jade-tinted shadow appears, primary background lifts
  to pure white with jade border, secondary fills with translucent
  jade. Matches feedback's "hover 时主按钮背景加深、次按钮填充半透明
  品牌色".

## 2026-05-11 — nav rename + reorder + home hero rewrite + capsule labels (FIX-024)

- **FIX-024a** `feat(nav)` — labels and order rewritten per the 2026-05-11
  feedback. New site nav: 首页 / 核心技术 / 产品 / 应用场景 / 科研合作 / 采购商城 / 联系我们
  (shop moved from position 4 to position 6). EN labels: Home / Core Tech /
  Products / Applications / Research / Shop / Contact. Footer link
  groups reordered to match. 7 HTML files patched.
- **FIX-024b** `polish(home)` — hero block rewritten per feedback:
  - eyebrow: 合肥幻联科技：植入式脑机接口系统解决方案提供商
  - H1: 幻联科技
  - lede: 以自主可控的电极与采集技术，赋能神经科学研究与临床转化。
  - cta2: 技术路线 → 了解技术路线
  - 3 hero-proof metrics relabeled
- **FIX-024c** `polish(home)` — 5 cinematic banner eyebrows rebadged to
  uppercase-brand "capsule" pattern: MICHIGAN · 植入, NEUROBOX · 采集,
  NEUROANALYSIS · 解码, CLEANROOM · 微纳加工, REHAB · 康复. Body copy
  for cineFab and cineDecode rewritten per feedback verbatim.
- **FIX-024d** `polish(home)` — pipeline 4 steps now lead with the same
  capsule brand: 01 MICHIGAN · 植入界面 / 02 NEUROBOX · 采集与定位 /
  03 NEUROANALYSIS · 信号解析 / 04 REHAB · 临床康复. Section kicker
  FULL STACK · 全链路. Title and sub rewritten verbatim per feedback.

Visual CSS for the capsule label (rounded pill, deep gray bg, brand
border) lands in FIX-025 next.

## 2026-05-11 — brand rename (FIX-023)

- **FIX-023** `breaking(brand)` — site-wide brand purge per the 2026-05-11
  feedback docx. The brand 星脑智联 / AstroMind is removed from every
  HTML, JSON, and Markdown file. New canonical names:
  - Chinese short brand: **幻联科技** (was 星脑智联)
  - Chinese legal name: **合肥幻联科技有限公司** (unchanged)
  - English short: **Huanlian Tech** (was AstroMind)
  - English long: **Huanlian Technology** / **Hefei Huanlian Technology**
  - Email `AstroMind@xnzlsmart.cn` preserved (real account on real domain)
  - JSON-LD `alternateName` array updated
  - 96 brand-string replacements across 14 files; 0 stale references
    remain outside the changelog history.

## 2026-05-09 — FOUL fix + zh/en parity polish (FIX-022)

- **FIX-022a** `bug(i18n)` — Flash of Unlocalized Content on EN load.
  Pages painted Chinese first, then i18n.js asynchronously rewrote to
  English — visible flash. Added an inline `<head>` gate script that
  synchronously detects target language (`?lang=` / localStorage /
  `navigator.language`) and adds `html.i18n-await` only when target ≠
  default. New CSS hides body opacity:0 while `.i18n-await`. `i18n.js`
  removes the class after `applyDict()` (and a 1.2s safety timeout
  prevents permanent invisibility on dict failure). 18ms fade-in.
- **FIX-022b** `polish(i18n)` — strict zh/en parity audit. Found 1 EN
  string still containing Chinese (`tech.hero.kicker` was `Technology · 技术`)
  and 6 orphan empty stub keys (`platform.services.p1Title..p6Title`).
  EN now `Technology` (matches other hero kickers like `Applications`,
  `Partners`, `Shop`, `Contact`); stubs removed.

## 2026-05-09 — site-wide i18n leak sweep (FIX-021)

- **FIX-021** `bug(i18n)` — full audit of all `<a>` and `<figcaption>` text
  for hardcoded Chinese without `data-i18n`. Closed 27 leaks:
  - `shop.html`: 16 product CTAs (询价 SpikeLink, 申请软件演示, 咨询康复方案
    等) bound to `shop.cta.{spikelink|ecog|michigan|microwire|neurobox|mpm
    |headstage|neuroanalysis|vr|hdmea|exo|ti|robot|eegcap|emotion|glasses}`
  - `technology.html`: 4 stack-caption figcaptions → `tech.stack.cap{1..4}`
  - `platform.html`: 4 tab figcaptions → `platform.tab.cap{1..4}`
  - `apps.html` / `contact.html` / `partners.html`: hero figcaptions →
    `{apps|contact|partners}.hero.cap`
  - Re-scan: 0 hardcoded Chinese remaining (only the bilingual
    skip-to-content link, which is by design).

## 2026-05-09 — i18n leak fix + partners density + eyebrow unification (FIX-020)

- **FIX-020a** `bug(i18n)` — three home cinematic banners (Cleanroom, Demo,
  Decode) had hardcoded Chinese text with no `data-i18n`, so toggling EN
  left them in Chinese. Added `home.cineFab.*`, `home.demo.*`,
  `home.cineDecode.*` keys (eyebrow / title / body) to both `zh.json` and
  `en.json` and wired the attributes in `index.html`.
- **FIX-020b** `polish(eyebrow)` — eyebrow pattern unified to
  `English · 中文`. `产品演示 · Demo` → `Demo · 产品演示`,
  `康复 · 数字化中心` → `Rehab · 数字化中心`. Cleanroom / Decode already
  matched.
- **FIX-020c** `feat(partners)` — added stats band between evidence-band
  and the strategic cinematic on `/partners`: 10+ / 5 / 4 / 3 across
  university+hospital partners, tier-3 clinical, research schools, and
  academic collaboration framework. New `partners.stats.*` keys; new
  `.hero-proof.partners-stats` 4-col CSS that collapses to 2-col @ 900px.

## 2026-05-09 — hero polish + bilingual eyebrow consistency (FIX-019)

- **FIX-019** `polish(hero)` — eyebrow / H1 split refined on platform + technology:
  - `platform.html` — eyebrow `产品矩阵` and H1 `产品矩阵` were duplicate.
    Eyebrow → `产品 · Product Matrix`; H1 → `设备体系`.
  - `technology.html` — H1 was 8-char "植入式 BCI 技术路线" (long).
    Eyebrow → `技术路线 · Technology`; H1 → `全栈自主可控`;
    lede absorbs "植入式 BCI 技术路线 · ..."
  - en.json mirrored: `Product · Matrix` / `Device Stack`,
    `Technology · 技术` / `Vertically integrated`.
  - Brings hero eyebrow pattern (`中文 · English`) in line with
    apps / partners / shop.

## 2026-05-09 — footer addr render fix (FIX-018)

- **FIX-018** `bug(footer)` — `footer.addr` switched from `data-i18n` (textContent)
  to `data-i18n-html` (innerHTML) on all 7 pages so the embedded `<br>` between
  street and suite renders as a line break instead of a literal `<br>` token.

## 2026-05-09 — IA + module redesign (FIX-010..012)

- **FIX-010** `feat(platform)` — Product Modules redesigned (`fd8428b`)
  - Tab buttons: chinese label + mono subtitle (SpikeLink / 3 系列 / NeuroBox · MPM / NeuroAnalysis · HD-MEA)
  - Tab content: image left + content right grid; real spec table (dl/dt/dd)
    showing 32-256 ch, 0-30 kHz, 2-14 mm; per-tab CTAs (询价 / 查看商城)
  - 360ms cubic-bezier fade between tabs
- **FIX-011** `feat(platform)` — Research Support Services upgraded (`fd8428b`)
  - 6 cards in auto-fit grid with per-card photo bg + dark overlay
  - amber numeral + tag pill + h3 + body + jade arrow CTA per card
- **FIX-012** `feat(IA)` — 3 new standalone pages + nav update (`fd8428b`)
  - `apps.html` — 4 application scenarios + 2 cinematic banners + CTA
  - `partners.html` — partner cards + strategic banner + CTA
  - `contact.html` — 3 contact-method cards + email-template checklist
    + prefilled mailto body
  - Home: removed ~110 lines of duplicate Apps/Partners/Contact content,
    replaced with a 3-card teaser linking to the new pages
  - Top nav across all 7 pages now links apps.html / partners.html /
    contact.html (no more #anchor jumps)

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

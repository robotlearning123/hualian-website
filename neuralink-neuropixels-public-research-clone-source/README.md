# Hualian Website (幻联科技)

合肥幻联科技有限公司产品官网，部署于 Cloudflare Pages。

## Live Site

**https://hualian-site.pages.dev/**

## Tech Stack

- Pure HTML/CSS/JS — no build step
- Cloudflare Pages deployment via `wrangler`
- Responsive design (375px / 768px / desktop)
- 8-slide product carousel with touch & keyboard support

## Content

Complete coverage of the 18-page product handbook:

- Company overview
- In-vivo neuroelectrophysiology solution overview
- 8 products: silicon electrode, ECoG electrode, microwire electrode, NeuroBox (3 models), headstage, NeuroAnalysis, HD-MEAs (3 variants), brain-on-chip
- Full spec tables, feature grids, application tags
- International & domestic partners

## Quick Start

```bash
cd neuralink-neuropixels-public-research-clone-source
python3 -m http.server 3473
```

Open http://127.0.0.1:3473/

## Deploy

```bash
mkdir -p /tmp/hualian-deploy/{assets/hualian,styles,scripts}
cp hualian.html /tmp/hualian-deploy/index.html
cp styles/*.css /tmp/hualian-deploy/styles/
cp scripts/hualian.js /tmp/hualian-deploy/scripts/
cp assets/hualian/*.{jpg,png} /tmp/hualian-deploy/assets/hualian/
cd /tmp/hualian-deploy && npx wrangler pages deploy . --project-name hualian-site
```

## Repository

https://github.com/robotlearning123/hualian-website

## Reference Materials

The `downloaded-sites/`, `public-clone/`, and `docs/` directories contain Neuralink/Neuropixels public-page research clones and PDF extraction artifacts used during development.

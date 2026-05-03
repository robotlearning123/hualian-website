# Two Website Clones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build local, visually faithful static clones of `https://neuralink.com/` and `https://www.neuropixels.org/` in `/home/robot/workspace/40-dong`.

**Architecture:** Use a dependency-free static site with one HTML file per target, shared base CSS, target-specific CSS, a small shared interaction script, and downloaded target assets. Verification is artifact-driven: browser snapshots, reference screenshots, local screenshots, structure checks, and visual-verdict JSON.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node.js for local static checks, `python3 -m http.server` or `npx serve` for preview, Chrome DevTools/Playwright for extraction and screenshot verification.

---

## Scope And Acceptance

- Clone only the visible public landing pages for the two URLs, not all subroutes.
- Preserve nav/header, hero/main sections, cards, footer, typography, spacing, colors, imagery, and responsive behavior.
- Preserve normal link destinations as outbound links to the original sites.
- Implement local-only interactions visible on the landing pages: Neuralink cookie/settings banner behavior, Neuralink carousel controls if present, Neuropixels dropdown/menu toggles if visible in extraction.
- Do not add framework dependencies unless the static approach fails and the user approves the dependency change.
- Done means each page has desktop and mobile screenshots, no missing major landmarks, key interactions pass, and visual-verdict scores are at or above 90 where browser-rendered assets allow it.

## File Structure

- Create: `index.html` - small local entry page linking to both clones.
- Create: `neuralink.html` - Neuralink landing-page clone.
- Create: `neuropixels.html` - Neuropixels landing-page clone.
- Create: `styles/base.css` - reset, shared variables, shared utility patterns.
- Create: `styles/neuralink.css` - Neuralink-specific layout, typography, imagery, responsive rules.
- Create: `styles/neuropixels.css` - Neuropixels-specific layout, typography, imagery, responsive rules.
- Create: `scripts/site.js` - cookie banner, carousel/menu toggles, and small UI state handlers.
- Create: `scripts/check-static.mjs` - validates that local HTML references existing local CSS, JS, and asset files.
- Create: `assets/neuralink/` - downloaded Neuralink images/video posters/SVGs used by the landing page.
- Create: `assets/neuropixels/` - downloaded Neuropixels images/logos/icons used by the landing page.
- Use: `output/playwright/` - reference and clone screenshots, browser snapshots, extracted style summaries.
- Use: `.omx/state/web-clone/` - extraction summaries and visual-verdict JSON records.

---

## Task 1: Complete Reference Extraction

**Files:**
- Write: `output/playwright/neuralink.snapshot.txt`
- Write: `output/playwright/neuropixels.snapshot.txt`
- Write: `output/playwright/neuralink-desktop-reference.png`
- Write: `output/playwright/neuralink-mobile-reference.png`
- Write: `output/playwright/neuropixels-desktop-reference.png`
- Write: `output/playwright/neuropixels-mobile-reference.png`
- Write: `.omx/state/web-clone/extraction.json`

- [ ] **Step 1: Capture desktop reference screenshots**

  Use Chrome DevTools/Playwright at `1440x1000`, full page:

  ```text
  https://neuralink.com/ -> output/playwright/neuralink-desktop-reference.png
  https://www.neuropixels.org/ -> output/playwright/neuropixels-desktop-reference.png
  ```

- [ ] **Step 2: Capture mobile reference screenshots**

  Use Chrome DevTools/Playwright at `390x844`, full page:

  ```text
  https://neuralink.com/ -> output/playwright/neuralink-mobile-reference.png
  https://www.neuropixels.org/ -> output/playwright/neuropixels-mobile-reference.png
  ```

- [ ] **Step 3: Extract DOM/style summaries**

  Save top-level DOM, computed colors, fonts, major section sizes, and interactive elements into `.omx/state/web-clone/extraction.json`.

- [ ] **Step 4: Record observed page structure**

  Neuralink currently exposes a cookie banner, top promo link, nav links, main hero heading, clinical trials CTA, speech/restoration copy, pioneer cards, "Pioneers Wanted" tiles, and footer links.

  Neuropixels currently exposes a Wix-style header/nav, product/software/support dropdown toggles, three main product cards, contact footer, logo, legal link, and footer nav.

## Task 2: Build Static Scaffold

**Files:**
- Create: `index.html`
- Create: `styles/base.css`
- Create: `scripts/site.js`
- Create: `scripts/check-static.mjs`

- [ ] **Step 1: Add a local entry page**

  `index.html` should link to `neuralink.html` and `neuropixels.html`. It is not part of the clone fidelity target; it only makes local preview navigation simple.

- [ ] **Step 2: Add base CSS**

  `styles/base.css` should define `box-sizing`, body margin reset, image/video sizing, link inheritance, visually hidden labels, and shared focus styles.

- [ ] **Step 3: Add shared interactions**

  `scripts/site.js` should use data attributes:

  ```js
  document.querySelectorAll('[data-dismiss]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(button.dataset.dismiss)?.setAttribute('hidden', '');
    });
  });

  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(button.dataset.toggle)?.toggleAttribute('hidden');
    });
  });
  ```

- [ ] **Step 4: Add static reference checker**

  `scripts/check-static.mjs` should parse the three HTML files and fail if any local `href`, `src`, or stylesheet/script path points to a missing file.

## Task 3: Download And Normalize Assets

**Files:**
- Create files under: `assets/neuralink/`
- Create files under: `assets/neuropixels/`
- Update references in: `.omx/state/web-clone/extraction.json`

- [ ] **Step 1: Download Neuralink assets**

  Download visible landing-page assets from extracted `img`, `source`, CSS background, and logo references into `assets/neuralink/`. Preserve descriptive filenames such as `tile-clinical-trials.jpg`, `tile-technology.jpg`, `hero-poster.jpg`, and `logo.svg` when the source names are hashed.

- [ ] **Step 2: Download Neuropixels assets**

  Download the header logo, product probe image, OneBox image, software icon, LinkedIn icon, and footer logo into `assets/neuropixels/`.

- [ ] **Step 3: Confirm dimensions**

  Record natural width/height and rendered width/height for each visible asset in `.omx/state/web-clone/extraction.json`, so CSS can match the original image proportions.

## Task 4: Implement Neuralink Clone

**Files:**
- Create: `neuralink.html`
- Create: `styles/neuralink.css`
- Modify: `scripts/site.js` if carousel behavior is required by extraction

- [ ] **Step 1: Build the semantic shell**

  Include cookie notice, promo announcement, `<nav>`, `<main>`, and `<footer>` in the same landmark order observed in the snapshot.

- [ ] **Step 2: Recreate content sections**

  Include the extracted Neuralink headings and CTA text:

  ```text
  From neural signals to life-changing impact
  Explore our clinical trials
  Building brain interfaces to restore speech_
  Meet our pioneers
  Pioneers Wanted
  ```

- [ ] **Step 3: Match Neuralink visual system**

  Use the extracted dark, cinematic page treatment, large hero typography, muted copy, rounded media tiles, footer columns, and responsive nav/menu behavior.

- [ ] **Step 4: Add Neuralink interactions**

  Cookie accept/decline and announcement dismiss should hide their banners locally. Carousel controls should move or reveal pioneer cards if the live page carousel is visible in reference screenshots.

## Task 5: Implement Neuropixels Clone

**Files:**
- Create: `neuropixels.html`
- Create: `styles/neuropixels.css`
- Modify: `scripts/site.js` for dropdown state if needed

- [ ] **Step 1: Build the semantic shell**

  Include skip link, `<header>`, site nav, `<main>`, and `<footer>` in the same landmark order observed in the snapshot.

- [ ] **Step 2: Recreate content sections**

  Include the extracted Neuropixels headings and card links:

  ```text
  A new era in electrophysiology with silicon probes: Large-scale neural recording with single cell resolution
  Neuropixels Probes
  Neuropixels System
  Neuropixels Software
  Getting started
  ```

- [ ] **Step 3: Match Neuropixels visual system**

  Recreate the centered Wix-style layout, white background, blue/purple navigation accents, product card spacing, compact typography, contact footer, and footer logo/text layout.

- [ ] **Step 4: Add Neuropixels interactions**

  Product, Software, and Support toggles should open local dropdown panels or expose their submenu state without navigating away.

## Task 6: Verify, Score, And Iterate

**Files:**
- Write: `output/playwright/neuralink-desktop-clone.png`
- Write: `output/playwright/neuralink-mobile-clone.png`
- Write: `output/playwright/neuropixels-desktop-clone.png`
- Write: `output/playwright/neuropixels-mobile-clone.png`
- Write: `.omx/state/web-clone/verdicts.json`

- [ ] **Step 1: Run the static checker**

  ```bash
  node scripts/check-static.mjs
  ```

  Expected: no missing local file references.

- [ ] **Step 2: Serve locally**

  ```bash
  python3 -m http.server 3456
  ```

  Expected clone URLs:

  ```text
  http://localhost:3456/neuralink.html
  http://localhost:3456/neuropixels.html
  ```

- [ ] **Step 3: Capture clone screenshots**

  Capture full-page screenshots at `1440x1000` and `390x844` for each clone page.

- [ ] **Step 4: Run visual verdicts**

  Compare each clone screenshot against the matching reference screenshot. Persist JSON records in `.omx/state/web-clone/verdicts.json` with `score`, `verdict`, `differences`, and `suggestions`.

- [ ] **Step 5: Spot-check structure and interactions**

  Confirm that both pages contain required landmarks and that:

  ```text
  Neuralink: cookie banner dismisses; announcement dismisses; CTA links retain original destinations.
  Neuropixels: dropdown toggles open; main card links retain original destinations; skip link reaches main content.
  ```

- [ ] **Step 6: Iterate highest-impact mismatches**

  Fix visual mismatches in this order: layout geometry, hero/card dimensions, typography scale, colors, imagery crop, then minor spacing. Stop after visual-verdict is at or above 90 for each page/viewport, or document any blocked difference caused by dynamic/live assets.

## Implementation Checkpoint

Do not start Task 2 or later until the user approves this plan. The only completed work before approval should be reference/template inspection and plan creation.

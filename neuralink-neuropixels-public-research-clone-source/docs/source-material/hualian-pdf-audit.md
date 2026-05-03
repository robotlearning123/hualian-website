# HuanLian PDF Source Material Audit

Source PDF: `/Users/robert/Documents/New project 2/合肥幻联科技有限公司产品手册2026.pdf`

This document is the source-of-truth audit for the HuanLian web page. The PDF text, rendered pages, and image inventory below should be treated as the basis for website copy, section structure, and visual assets.

## Extracted Evidence

- PDF metadata: 18 pages, Canva-generated, no encryption, no JavaScript, page size `1190.25 x 807.75 pts`.
- Complete raw extraction root: `docs/source-material/pdf-extract/`.
- Full extracted text: `docs/source-material/hualian-product-handbook-2026.txt`, plus `docs/source-material/pdf-extract/text/full-layout.txt` and `docs/source-material/pdf-extract/text/full-raw.txt`.
- Per-page text extraction: `docs/source-material/pdf-extract/text/pages/page-01.txt` through `docs/source-material/pdf-extract/text/pages/page-18.txt`.
- Embedded image inventory: `docs/source-material/pdf-extract/metadata/pdfimages-list.txt`.
- Embedded image manifest: `docs/source-material/pdf-extract/metadata/embedded-images-manifest.csv`.
- All embedded image files: `docs/source-material/pdf-extract/embedded-images/image-000.*` through `docs/source-material/pdf-extract/embedded-images/image-165.*`.
- Rendered page images: `assets/hualian/source-pages/page-01.png` through `assets/hualian/source-pages/page-18.png`, plus 240 dpi originals in `docs/source-material/pdf-extract/pages-240dpi/`.
- Positioned XML/text/image extraction: `docs/source-material/pdf-extract/structure/hualian-product-handbook-2026.xml`.
- Image object count from `pdfimages -list`: 166 extracted files total, consisting of 115 `image` objects and 51 `smask` transparency masks. Pages 17 and 18 are logo-heavy and contain the most image objects.

## Page Inventory

| PDF page | Source page image | Text lines | Content | Website use |
| --- | --- | --- | --- | --- |
| 1 | `assets/hualian/source-pages/page-01.png` | 1-18 | Cover, slogan, source title, QR/contact block, phone, email, address, company name. | Hero brand/slogan, contact section, footer. |
| 2 | `assets/hualian/source-pages/page-02.png` | 20-33 | Company introduction: invasive BCI systems, implantable electrodes, high-throughput acquisition equipment, research service, core team, product matrix, mission. | Intro section and product positioning. |
| 3 | `assets/hualian/source-pages/page-03.png` | 35-58 | Table of contents. | Information architecture checklist. |
| 4 | `assets/hualian/source-pages/page-04.png` | 60-94 | Products & Services matrix: silicon electrode, ECoG, MPM positioning system, NeuroBox, VR, NeuroAnalysis, clinical trials, animal experiments, neural function/activity modules. | Matrix section image and workflow copy. |
| 5 | `assets/hualian/source-pages/page-05.png` | 99-111 | Overall in vivo neuroelectrophysiology solution, closed loop from electrode implantation to acquisition and analysis. | Hero image and intro copy. |
| 6 | `assets/hualian/source-pages/page-06.png` | 114-149 | Michigan silicon probe description, 32-256 channels, 15 μm thickness, 3/6/9/15 mm lengths, advantages. | Product tab: silicon electrode. |
| 7 | `assets/hualian/source-pages/page-07.png` | 150-189 | Silicon probe parameters and application scenarios. | Product tab specs; currently summarized, not full parameter table. |
| 8 | `assets/hualian/source-pages/page-08.png` | 192-225 | ECoG flexible electrode description, research objects, application fields, advantages. | Product tab: ECoG. |
| 9 | `assets/hualian/source-pages/page-09.png` | 228-268 | ECoG parameters and BCI/clinical application scenarios. | Product tab specs; currently summarized, not full application grid. |
| 10 | `assets/hualian/source-pages/page-10.png` | 270-307 | Microwire electrode description, research objects, parameters, connectors, materials. | Product tab: microwire. |
| 11 | `assets/hualian/source-pages/page-11.png` | 310-330 | NeuroBox product page and research object/application fields. | NeuroBox section image and overview. |
| 12 | `assets/hualian/source-pages/page-12.png` | 333-406 | NeuroBox technical parameters, N512/N1024/N2048 models, port diagram, 2048 max channels. | NeuroBox section specs; currently summarized. |
| 13 | `assets/hualian/source-pages/page-13.png` | 409-438 | NeuroAnalysis, Headstage and dedicated cable, channels, connectors and cable specs. | Product tab: software and headstage. |
| 14 | `assets/hualian/source-pages/page-14.png` | 441-478 | HD-MEAs description, key advantages, performance parameters, product advantage. | Chip section. |
| 15 | `assets/hualian/source-pages/page-15.png` | 480-524 | HD-MEAs examples and technical parameters for PSM/PLM/PDMS applications. | Chip section; currently summarized. |
| 16 | `assets/hualian/source-pages/page-16.png` | 528-552 | Brain-on-a-Chip and biological computer concepts, closed-loop interaction and biocomputing. | Chip section. |
| 17 | `assets/hualian/source-pages/page-17.png` | 555-600 | International ecosystem partners. | Ecosystem partner section. |
| 18 | `assets/hualian/source-pages/page-18.png` | 603-614 | Domestic ecosystem partners. | Ecosystem partner section. |

## Selected Website Assets

| Web asset | Source basis | Notes |
| --- | --- | --- |
| `assets/hualian/hualian-logo.png` | Page 1 logo crop | Used for header, favicon and footer mark. |
| `assets/hualian/in-vivo-system.jpg` | Page 5 rendered crop | Hero background, system/workstation visual. |
| `assets/hualian/product-matrix.jpg` | Page 4 rendered crop | Product/service matrix section. |
| `assets/hualian/silicon-probe.jpg` | Page 6 rendered crop | Silicon probe product tab. |
| `assets/hualian/ecog-electrode.jpg` | Page 8 rendered crop | ECoG product tab. |
| `assets/hualian/microwire.jpg` | Page 10 rendered crop | Microwire product tab. |
| `assets/hualian/neurobox.jpg` | Page 11 rendered crop | NeuroBox acquisition section. |
| `assets/hualian/headstage.jpg` | Page 13 rendered crop | NeuroAnalysis/Headstage tab. |
| `assets/hualian/hd-mea-device.jpg` | Page 14 rendered crop | HD-MEAs chip section. |
| `assets/hualian/brain-on-chip.jpg` | Page 16 rendered crop | Brain-on-a-Chip diagram section. |
| `assets/hualian/international-partners.jpg` | Page 17 rendered page | International ecosystem partner section. |
| `assets/hualian/domestic-partners.jpg` | Page 18 rendered page | Domestic ecosystem partner section. |
| `assets/hualian/wave-field.jpg` | Page 1 wave crop | Contact section background. |

## Copy Traceability

- Main brand and slogan come from page 1: `幻联科技`, `以脑引智 联动未来`, `Pioneering the Future`.
- Company positioning comes from page 2: invasive BCI systems, implantable electrodes, high-throughput acquisition equipment, and full-stack research service.
- End-to-end system narrative comes from page 5: electrode implantation, signal acquisition, and data analysis closed loop.
- Product family comes from pages 4 and 6-16: silicon probes, ECoG, microwire, NeuroBox, NeuroAnalysis, Headstage, HD-MEAs, Brain-on-a-Chip and biological computer.
- Contact details come from page 1: `18656081001`, `35745809@qq.com`, `安徽省合肥市蜀山区潜山路888号百利中心南塔3楼318室`.

## Current Web Gaps

- MPM multi-arm brain atlas positioning system and VR system are called out in matrix copy but still do not have dedicated product sections.
- International and domestic ecosystem partners from pages 17-18 are represented as source-page-derived images; individual partner names are not manually retyped to avoid logo/text transcription drift.
- Product parameter tables are currently compressed into marketing summaries. If the web page is meant to double as a product catalog, add full tables for silicon probes, ECoG, microwire, NeuroBox, Headstage and HD-MEAs.
- Page 11 NeuroBox description text appears to repeat silicon-probe language in the PDF; use the page 12 technical parameter table as the stronger source for NeuroBox-specific claims.

## Working Rules For The Website

- Do not introduce product claims that are not present in the PDF unless separately sourced.
- Keep public-facing claims precise: distinguish animal/basic research, clinical/preclinical research, and clinical trial contexts as the PDF does.
- Use `docs/source-material/pdf-extract/` as the raw source layer for future copy, image, crop, and layout decisions.
- Use source page images for future visual checks before cropping any new asset.
- Prefer Chinese copy from the PDF as the canonical text, with concise English only when it is already present or needed for navigation.

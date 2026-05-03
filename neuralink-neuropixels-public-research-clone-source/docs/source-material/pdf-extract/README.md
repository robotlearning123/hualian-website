# HuanLian PDF Raw Extraction

Source PDF: `/Users/robert/Documents/New project 2/合肥幻联科技有限公司产品手册2026.pdf`

This directory is the complete raw-material extraction for the HuanLian website. Treat it as the primary source for copy, visual assets, page references, and future crop decisions.

## Contents

- `metadata/pdfinfo.txt` - PDF metadata from `pdfinfo`.
- `metadata/pdfimages-list.txt` - raw `pdfimages -list` inventory.
- `metadata/embedded-images-manifest.csv` - extracted image files mapped to PDF page, object number, dimensions, encoding, object ID, and file size.
- `metadata/extraction-summary.json` - machine-readable extraction summary.
- `text/full-layout.txt` - full extracted text preserving layout where possible.
- `text/full-raw.txt` - full extracted text in raw order.
- `text/pages/page-01.txt` through `text/pages/page-18.txt` - per-page extracted text.
- `pages-240dpi/page-01.png` through `pages-240dpi/page-18.png` - full-page raster renders at 240 dpi.
- `embedded-images/image-000.*` through `embedded-images/image-165.*` - all embedded image objects extracted by `pdfimages -all`, including transparency masks.
- `structure/hualian-product-handbook-2026.xml` - positioned PDF text and image references from `pdftohtml -xml -hidden -c`.
- `structure/hualian-product-handbook-2026-*` - image files emitted by the XML extraction.

## Extraction Counts

- PDF pages: 18.
- Per-page text files: 18.
- 240 dpi page renders: 18.
- Embedded image files from `pdfimages -all`: 166 total.
- Embedded image object types: 115 `image`, 51 `smask`.
- XML structure directory files: 116 total, including the XML file.

## Page Image Object Counts

| PDF page | Extracted image objects |
| --- | ---: |
| 1 | 7 |
| 2 | 2 |
| 3 | 0 |
| 4 | 26 |
| 5 | 10 |
| 6 | 6 |
| 7 | 8 |
| 8 | 2 |
| 9 | 8 |
| 10 | 2 |
| 11 | 2 |
| 12 | 8 |
| 13 | 4 |
| 14 | 7 |
| 15 | 8 |
| 16 | 5 |
| 17 | 26 |
| 18 | 35 |

## Usage Rule

Use this extraction as the raw source layer. Website-ready crops can live under `assets/hualian/`, but their origin should be traceable to the page renders, embedded image manifest, or XML structure in this directory.

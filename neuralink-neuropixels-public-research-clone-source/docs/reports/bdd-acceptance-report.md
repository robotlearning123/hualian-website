# BDD Acceptance Report

Generated at: 2026-05-01T20:36:12.435Z

## Summary

- Scenarios: 11
- Passed: 11
- Failed: 0

## Scenarios

### PASS - Public discovery scope is complete and clean

Given the saved public-page manifest

When the public page and document counts are evaluated

Then it contains only successful public pages for both sites

Duration: 0 ms

### PASS - Every public page has local clone files and raw screenshots

Given every manifest page

When the local page and screenshot assets are inspected

Then each page has an HTML clone plus desktop and mobile PNG assets with matching dimensions

Duration: 35 ms

### PASS - Raw screenshots and local clone renders match

Given the generated visual comparison report

When every desktop and mobile comparison row is evaluated

Then all 138 raw-vs-clone comparisons pass and failures are zero

Duration: 0 ms

### PASS - Static references resolve

Given the static homepage clones

When local href/src/poster references are checked

Then all referenced local files exist

Duration: 17 ms

### PASS - Repository excludes runtime caches and private execution state

Given the files tracked by git

When ignored and sensitive paths are checked

Then runtime caches are not tracked and common secret material is absent

Duration: 298 ms

### PASS - GitHub repository is private

Given the configured GitHub remote

When GitHub repository metadata is queried

Then the repository visibility is PRIVATE

Duration: 693 ms

### PASS - Local public clone serves key pages

Given the generated public-clone directory

When it is served through a local HTTP server

Then the index and representative pages return HTTP 200

Duration: 126 ms

### PASS - Public source assets are downloaded locally

Given the full public-site download report

When public static resources are counted by type

Then the local mirror includes pages, scripts, images, PDFs, GIFs, and videos with only known public CDN misses

Duration: 17 ms

### PASS - Public interactions are inventoried

Given the raw public HTML interaction inventory

When links, buttons, forms, and menu triggers are counted

Then the research clone has a page-backed inventory for public front-end behavior

Duration: 1 ms

### PASS - Public GIF and video media are locally playable

Given the synchronized media gallery manifest

When local media files and the gallery HTML are inspected

Then all detected public GIF/video assets exist in the clone

Duration: 0 ms

### PASS - Downloaded HTML mirrors support public interactions

Given the downloaded local mirrors for Neuralink and Neuropixels

When a clean headless Chrome opens and clicks representative controls

Then local pages render, media loads, navigation works, and original static assets are not requested

Duration: 190466 ms


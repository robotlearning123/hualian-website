# Live vs Local Site Report

Generated: 2026-05-01T19:55:48.278Z

Strict overall: FAIL

This report compares the current live public websites against the local downloaded mirror. It is intentionally strict: title, visible H1s, body length tolerance, visible link/control/form/input/image/video counts, current sitemap coverage, local file presence, and homepage screenshot PSNR are all evaluated.

## Summary

- Manifest pages: 69
- Live sitemap pages: 67
- Strict DOM pass: 62/69
- Strict DOM failures: 7
- Missing from manifest: 1
- No longer in live sitemap: 3
- Missing local files: 0
- Homepage visual pass: 0/4

## Homepage Visual Rows

| Site | Viewport | Pass | PSNR | Live | Local |
| --- | --- | --- | --- | --- | --- |
| neuralink | desktop | FAIL | 16.200533 | docs/reports/live-vs-local-screenshots/neuralink-desktop-live.png | docs/reports/live-vs-local-screenshots/neuralink-desktop-local.png |
| neuralink | mobile | FAIL | 14.742208 | docs/reports/live-vs-local-screenshots/neuralink-mobile-live.png | docs/reports/live-vs-local-screenshots/neuralink-mobile-local.png |
| neuropixels | desktop | FAIL | 27.208346 | docs/reports/live-vs-local-screenshots/neuropixels-desktop-live.png | docs/reports/live-vs-local-screenshots/neuropixels-desktop-local.png |
| neuropixels | mobile | FAIL | 27.828716 | docs/reports/live-vs-local-screenshots/neuropixels-mobile-live.png | docs/reports/live-vs-local-screenshots/neuropixels-mobile-local.png |

## Strict DOM Failures

| Site | Slug | Failed Checks |
| --- | --- | --- |
| neuropixels | news | body length within 5%: live=149 local=826; visible links exact count: live=0 local=32; visible controls exact count: live=6 local=3; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | news-categories-imec-news | body length within 5%: live=149 local=826; visible links exact count: live=0 local=32; visible controls exact count: live=6 local=3; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | news-categories-publications | body length within 5%: live=149 local=826; visible links exact count: live=0 local=32; visible controls exact count: live=6 local=3; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | post-fully-integrated-silicon-probes-for-high-density-recording-of-neural-activity-nature-2017 | body length within 5%: live=857 local=808; visible controls exact count: live=1 local=0 |
| neuropixels | post-neuropixels-data-acquisition-system-ieee-2019 | body length within 5%: live=940 local=891; visible controls exact count: live=1 local=0 |
| neuropixels | probe1-0 | body length within 5%: live=2359 local=2186; visible links exact count: live=21 local=20; visible controls exact count: live=11 local=9; visible images exact count: live=8 local=7 |
| neuropixels | support | visible links exact count: live=61 local=60 |

## Sitemap Deltas

### Missing From Manifest

- neuropixels: https://www.neuropixels.org/probes-np1-0

### In Manifest But Not Current Live Sitemap

- neuropixels: https://www.neuropixels.org/news
- neuropixels: https://www.neuropixels.org/news/categories/imec-news
- neuropixels: https://www.neuropixels.org/news/categories/publications

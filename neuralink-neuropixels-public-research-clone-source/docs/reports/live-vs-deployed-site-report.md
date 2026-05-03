# Live vs Local Site Report

Generated: 2026-05-01T20:11:55.732Z

Strict overall: FAIL

Clone target: Cloudflare Pages deployed preview

This report compares the current live public websites against the downloaded mirror target above. It is intentionally strict: title, visible H1s, body length tolerance, visible link/control/form/input/image/video counts, current sitemap coverage, local file presence, and homepage screenshot PSNR are all evaluated.

## Summary

- Manifest pages: 69
- Live sitemap pages: 67
- Strict DOM pass: 59/69
- Strict DOM failures: 10
- Missing from manifest: 1
- No longer in live sitemap: 3
- Missing local files: 0
- Homepage visual pass: 0/4

## Homepage Visual Rows

| Site | Viewport | Pass | PSNR | Live | Local |
| --- | --- | --- | --- | --- | --- |
| neuralink | desktop | FAIL | 14.913405 | docs/reports/live-vs-deployed-screenshots/neuralink-desktop-live.png | docs/reports/live-vs-deployed-screenshots/neuralink-desktop-local.png |
| neuralink | mobile | FAIL | 14.520063 | docs/reports/live-vs-deployed-screenshots/neuralink-mobile-live.png | docs/reports/live-vs-deployed-screenshots/neuralink-mobile-local.png |
| neuropixels | desktop | FAIL | 27.208346 | docs/reports/live-vs-deployed-screenshots/neuropixels-desktop-live.png | docs/reports/live-vs-deployed-screenshots/neuropixels-desktop-local.png |
| neuropixels | mobile | FAIL | 23.439152 | docs/reports/live-vs-deployed-screenshots/neuropixels-mobile-live.png | docs/reports/live-vs-deployed-screenshots/neuropixels-mobile-local.png |

## Strict DOM Failures

| Site | Slug | Failed Checks |
| --- | --- | --- |
| neuralink | careers-apply | visible h1 exact: live=[] local=["Loading Job Application..."] |
| neuralink | mailing-list | inputs exact count: live=10 local=9 |
| neuropixels | news | body length within 5%: live=149 local=826; visible links exact count: live=0 local=29; visible controls exact count: live=6 local=0; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | news-categories-imec-news | body length within 5%: live=149 local=826; visible links exact count: live=0 local=29; visible controls exact count: live=6 local=0; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | news-categories-publications | body length within 5%: live=149 local=826; visible links exact count: live=0 local=29; visible controls exact count: live=6 local=0; forms exact count: live=0 local=1; inputs exact count: live=1 local=3; visible images exact count: live=0 local=1 |
| neuropixels | post-a-966-electrode-neural-probe-with-384-configurable-channels-in-0-13-c2-b5m-soi-cmos-ieee-2016 | body length within 5%: live=842 local=793; visible controls exact count: live=1 local=0 |
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

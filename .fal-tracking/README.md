# fal.ai run tracking

Audit trail of every fal.ai submission. Each generation run writes:
- `submission.json` — the queue POST response (request_id, status_url)
- `result.json` — the final response payload (image / video URL, seed)

Layout:
- `initial-runs/` — submissions from the first 5 batches during the initial buildout
- `runs/<UTC-timestamp>/` — every subsequent run from `scripts/regenerate-assets.sh`

The actual generated assets live next to the manifest in `assets/images/` and `assets/media/`.
The prompts that produced them live in `assets-manifest.json` (machine-readable) and `PROMPTS.md` (human-readable).

#!/usr/bin/env bash
# Re-create every asset listed in assets-manifest.json by re-submitting the same
# prompts to fal.ai. Idempotent: skips files that already exist unless --force.
#
# Auth: needs FAL_KEY in env (or pulled from 1Password if `op` available).
#
# Usage:
#   ./scripts/regenerate-assets.sh                 # only generate missing
#   ./scripts/regenerate-assets.sh --force         # rerun every prompt
#   ./scripts/regenerate-assets.sh --batch batch3  # only this batch
#   ./scripts/regenerate-assets.sh --kind video    # only image|video
#
# Output: assets/images/*.png and assets/media/*.mp4 written next to manifest.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/assets-manifest.json"
TRACK_DIR="$ROOT/.fal-tracking/runs/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TRACK_DIR"

FORCE=0
ONLY_BATCH=""
ONLY_KIND=""
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --batch=*) ONLY_BATCH="${arg#--batch=}" ;;
    --batch) shift; ONLY_BATCH="${1:-}"; shift ;;
    --kind=*) ONLY_KIND="${arg#--kind=}" ;;
    --kind) shift; ONLY_KIND="${1:-}"; shift ;;
  esac
done

if [ -z "${FAL_KEY:-}" ] && command -v op >/dev/null; then
  FAL_KEY="$(op item get qx6pybne7pprvkj4yqcy4t5c5y --vault Dev --reveal --format json 2>/dev/null \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['fields'][0]['value'])" 2>/dev/null || true)"
fi
if [ -z "${FAL_KEY:-}" ]; then
  echo "ERROR: FAL_KEY not set (and op CLI not configured for 1Password). Export it manually." >&2
  exit 1
fi

submit_and_wait () {
  local kind="$1" prompt="$2" out="$3" tag="$4"
  local model params
  if [ "$kind" = "image" ]; then
    model="fal-ai/gpt-image-2"
    params='{"image_size":"landscape_16_9","num_images":1}'
  else
    model="fal-ai/bytedance/seedance/v1/pro/text-to-video"
    params='{"aspect_ratio":"16:9","resolution":"1080p","duration":"5"}'
  fi
  local payload
  payload="$(python3 -c "import json,sys; p=json.loads(sys.argv[1]); p['prompt']=sys.argv[2]; print(json.dumps(p))" "$params" "$prompt")"
  local resp
  resp="$(curl -sS -X POST "https://queue.fal.run/$model" -H "Authorization: Key $FAL_KEY" -H "Content-Type: application/json" -d "$payload")"
  echo "$resp" > "$TRACK_DIR/${tag}.submission.json"
  local status_url response_url
  status_url="$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['status_url'])")"
  response_url="$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['response_url'])")"
  local i status=""
  for i in $(seq 1 60); do
    status="$(curl -sS -H "Authorization: Key $FAL_KEY" "$status_url" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status'))")"
    [ "$status" = "COMPLETED" ] && break
    sleep 8
  done
  if [ "$status" != "COMPLETED" ]; then
    echo "WARN: $tag did not complete in time (status=$status); skipping" >&2
    return 1
  fi
  local result url
  result="$(curl -sS -H "Authorization: Key $FAL_KEY" "$response_url")"
  echo "$result" > "$TRACK_DIR/${tag}.result.json"
  if [ "$kind" = "image" ]; then
    url="$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); imgs=d.get('images') or []; print(imgs[0].get('url','') if imgs else '')")"
  else
    url="$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); v=d.get('video') or {}; print(v.get('url',''))")"
  fi
  if [ -z "$url" ]; then
    echo "WARN: $tag returned no media URL" >&2
    return 1
  fi
  mkdir -p "$(dirname "$ROOT/$out")"
  curl -sSL "$url" -o "$ROOT/$out"
  echo "OK  $out"
}

python3 - <<PY > "$TRACK_DIR/plan.tsv"
import json, sys, os
m=json.load(open("$MANIFEST"))
for batch_id, batch in m["generated"].items():
    for it in batch["items"]:
        kind=it["kind"]; out=it["out"]; prompt=it["prompt"]
        tag=f"{batch_id}__{os.path.splitext(os.path.basename(out))[0]}"
        print("\t".join([batch_id, tag, kind, out, prompt]))
PY

while IFS=$'\t' read -r batch_id tag kind out prompt; do
  [ -n "$ONLY_BATCH" ] && [ "$ONLY_BATCH" != "$batch_id" ] && continue
  [ -n "$ONLY_KIND" ] && [ "$ONLY_KIND" != "$kind" ] && continue
  if [ "$FORCE" = "0" ] && [ -f "$ROOT/$out" ]; then
    echo "SKIP $out (exists)"
    continue
  fi
  submit_and_wait "$kind" "$prompt" "$out" "$tag" || true
done < "$TRACK_DIR/plan.tsv"

echo "Done. Tracking JSON saved to: $TRACK_DIR"

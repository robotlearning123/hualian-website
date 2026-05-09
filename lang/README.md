# i18n — adding a new language

The site uses a tiny vanilla i18n (no build step, no CDN). Two layers:

- `lang/registry.json` — list of supported languages + default
- `lang/<code>.json` — the actual dictionary (same shape as `zh.json`)

The runtime in `scripts/i18n.js`:
1. Loads `lang/registry.json` on first page load
2. Picks a language: `?lang=` URL param > `localStorage` > `navigator.language` match > `registry.default`
3. Fetches `lang/<chosen>.json` and rewrites every `[data-i18n]` element
4. The button with `[data-lang-switch]` rotates through registered languages.
   For 3+ languages it auto-upgrades into a `<select>` dropdown.

## Add a new language (example: Japanese)

1. Copy `en.json` → `ja.json`. Translate every value (do not rename keys).
2. Edit `registry.json`:
   ```json
   {
     "default": "zh",
     "languages": [
       { "code": "zh", "label": "中", "htmlLang": "zh-CN", "ariaLabel": "切换中文",   "switchLabelTo": "EN" },
       { "code": "en", "label": "EN", "htmlLang": "en",    "ariaLabel": "Switch to English", "switchLabelTo": "中" },
       { "code": "ja", "label": "日", "htmlLang": "ja",    "ariaLabel": "日本語に切り替え", "switchLabelTo": "中" }
     ]
   }
   ```
3. Done. The toggle button auto-becomes a `<select>` for 3+ languages.

## Key conventions

- Top-level: `meta.*`, `brand.*`, `nav.*`, `footer.*` — site chrome
- Per-page: `home.*`, `tech.*`, `platform.*`, `shop.*`, `apps.*`, `partners.*`, `contact.*`
- Inside a page namespace: `hero.*`, `cta.*`, plus per-section names

## When the dictionary is missing a key

The element keeps whatever literal text is in the HTML (the source-of-truth Chinese).
If you see Chinese in EN mode → that key is missing in `en.json`. Add it.

## Validation

Both files must be valid JSON and ideally have the same key set:

```bash
python3 -c "import json; json.load(open('lang/zh.json')); json.load(open('lang/en.json')); print('both valid')"
```

# i18n — Huanlian site internationalization

The site uses a tiny vanilla i18n (no build step, no CDN). Two layers:

- `lang/registry.json` — list of supported languages + default
- `lang/<code>.json` — the actual dictionary (same shape as `zh.json`)

The runtime in `scripts/i18n.js`:
1. Loads `lang/registry.json` on first page load
2. Picks a language: `?lang=` URL param > `localStorage` > `navigator.language` match > `registry.default`
3. Fetches `lang/<chosen>.json` and rewrites every `[data-i18n]` element
4. The button with `[data-lang-switch]` rotates through registered languages.
   For 3+ languages it auto-upgrades into a `<select>` dropdown.

## Three binding attributes

| Attribute | Behavior | Example |
|---|---|---|
| `data-i18n="key"` | Sets `el.textContent = dict[key]`. HTML inside the value is escaped. | `<h1 data-i18n="home.hero.title">星脑智联</h1>` |
| `data-i18n-html="key"` | Sets `el.innerHTML = dict[key]`. Use when value contains tags like `<br>`. | `<p data-i18n-html="footer.addr">合肥市…<br>百利中心…</p>` |
| `data-i18n-attr="attr:key,attr2:key2"` | Sets attributes (description, alt, aria-label, etc.). Comma-separated pairs. | `<meta name="description" content="…" data-i18n-attr="content:meta.homeDesc">` |

## FOUL gate (no flash on EN load)

For non-default languages, an inline `<head>` script in every HTML adds
`html.i18n-await` synchronously before paint. CSS hides body opacity:0
while that class is present. `i18n.js` calls `revealReady()` after the
dictionary is applied, which removes `.i18n-await` and adds
`.i18n-ready`. A 1.2s safety timeout in `i18n.js` guarantees the body
is shown even if the dict fetch fails.

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

## Key namespaces

| Namespace | Used on | Notes |
|---|---|---|
| `meta.*` | every page | title + description per page (homeTitle, techTitle, …) |
| `brand.*` | site header | name + subtitle |
| `nav.*` | site header + footer | home / tech / platform / shop / apps / partners / contact |
| `footer.*` | every page | name / sub / h.{site,more,contact,pdf} / addr / copy |
| `home.*` | `index.html` | hero / cap / pipe / launch / cine{1,2,3} / cineFab / cineDecode / demo / teaser / contact / etc. |
| `tech.*` | `technology.html` | hero / core / stack.{cap1..cap4} / lab / ext / academic / cta |
| `platform.*` | `platform.html` | hero / modules / tab.{cap1..cap4} / services / launch |
| `shop.*` | `shop.html` | hero / products.{16 product subtrees} / cta.{16 inquiry buttons} / order |
| `apps.*` | `apps.html` | hero / list / cine{1,2} / cta |
| `partners.*` | `partners.html` | hero / list / stats / cine / cta |
| `contact.*` | `contact.html` | hero / info / form / cta |

## Eyebrow / kicker bilingual conventions

- **Page hero kicker**: ZH = `中文 · English` (e.g. `应用方向 · Applications`). EN = `English` only (decoration not needed).
- **Cinematic banner eyebrow**: `English · 中文` on ZH, `English · English` on EN (keeps the `English ·` lead-in for visual hierarchy).
- **Section kicker**: single language each side (`核心技术` ↔ `Core Tech`).
- **Product card kicker (shop)**: identical across both — proper noun (e.g. `SpikeLink`).

## Validation

Both files must be valid JSON and have the same key set:

```bash
python3 << 'PY'
import json
zh = json.load(open('lang/zh.json'))
en = json.load(open('lang/en.json'))

def flatten(d, prefix=''):
    out = {}
    for k, v in d.items():
        kk = f'{prefix}.{k}' if prefix else k
        out.update(flatten(v, kk) if isinstance(v, dict) else {kk: v})
    return out

zk, ek = set(flatten(zh)), set(flatten(en))
print('zh only:', sorted(zk - ek))
print('en only:', sorted(ek - zk))
print('both valid' if zk == ek else 'KEY DRIFT — fix above')
PY
```

## When the dictionary is missing a key

The element keeps whatever literal text is in the HTML (the source-of-truth Chinese). If you see Chinese in EN mode → that key is missing in `en.json`. Add it.

## Adding new content

1. Write the markup with default Chinese:
   ```html
   <h2 data-i18n="apps.list.t5">脑控外设</h2>
   ```
2. Add the key to `lang/zh.json`:
   ```json
   { "apps": { "list": { "t5": "脑控外设" } } }
   ```
3. Mirror it in `lang/en.json`:
   ```json
   { "apps": { "list": { "t5": "Brain-controlled devices" } } }
   ```
4. Run the validation snippet — `both valid` should print.

## Avoid

- Hardcoding Chinese in `<a>` text, `<figcaption>`, or button content without `data-i18n` (FIX-021 cleaned 27 such leaks).
- Using `data-i18n` for content with HTML tags — use `data-i18n-html` instead (textContent escapes tags).
- Renaming keys in only one of the two dictionaries (causes drift; the validation snippet above catches it).

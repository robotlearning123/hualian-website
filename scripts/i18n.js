(function () {
  const STORE_KEY = "huanlian.lang";
  const SUPPORTED = ["zh", "en"];
  const DEFAULT = "zh";

  function pickLang() {
    const url = new URL(location.href);
    const fromUrl = url.searchParams.get("lang");
    if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT;
  }

  function get(dict, key) {
    return key.split(".").reduce((o, k) => (o == null ? o : o[k]), dict);
  }

  function applyDict(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const val = get(dict, key);
      if (typeof val === "string") el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.dataset.i18nHtml;
      const val = get(dict, key);
      if (typeof val === "string") el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      // format: "attr:key,attr2:key2"
      const spec = el.dataset.i18nAttr;
      spec.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const val = get(dict, key);
        if (typeof val === "string" && attr) el.setAttribute(attr, val);
      });
    });
  }

  async function load(lang) {
    const res = await fetch(`lang/${lang}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`lang ${lang} not found`);
    return res.json();
  }

  async function setLang(lang) {
    const target = SUPPORTED.includes(lang) ? lang : DEFAULT;
    try {
      const dict = await load(target);
      applyDict(dict);
      document.documentElement.lang = target === "zh" ? "zh-CN" : "en";
      localStorage.setItem(STORE_KEY, target);
      const url = new URL(location.href);
      if (target === DEFAULT) url.searchParams.delete("lang");
      else url.searchParams.set("lang", target);
      history.replaceState(null, "", url.toString());
      document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
        btn.textContent = target === "zh" ? "EN" : "中";
        btn.setAttribute("aria-label", target === "zh" ? "Switch to English" : "切换中文");
      });
    } catch (err) {
      console.warn("i18n load failed:", err);
    }
  }

  function init() {
    const initial = pickLang();
    setLang(initial);
    document.querySelectorAll("[data-lang-switch]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const cur = localStorage.getItem(STORE_KEY) || DEFAULT;
        setLang(cur === "zh" ? "en" : "zh");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.huanlianI18n = { setLang };
})();

// i18n.js — bilingual (en/zh) support with localStorage persistence.
const I18n = {
  lang: localStorage.getItem('lang') || 'en',
  strings: { en: {}, zh: {} },
  setStrings(s) { this.strings = s; },
  getLang() { return this.lang; },
  setLang(l) {
    if (l !== 'en' && l !== 'zh') return;
    this.lang = l;
    localStorage.setItem('lang', l);
    this._notify();
  },
  toggle() { this.setLang(this.lang === 'en' ? 'zh' : 'en'); },
  // Translate a UI string key for the current language (falls back to English, then the key).
  t(key) {
    const l = this.strings[this.lang];
    if (l && l[key] != null) return l[key];
    if (this.strings.en && this.strings.en[key] != null) return this.strings.en[key];
    return key;
  },
  // Resolve a bilingual object { en, zh } to the current language.
  localize(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[this.lang] != null ? obj[this.lang] : (obj.en != null ? obj.en : '');
  },
  _subs: [],
  onChange(cb) { this._subs.push(cb); },
  _notify() { this._subs.forEach((cb) => cb(this.lang)); }
};

// Make it available to other module scripts loaded as classic scripts.
window.I18n = I18n;

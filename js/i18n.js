// Tiny client-side i18n engine for a zero-build static site.
// Load order per page: i18n-common.js  →  inline window.I18N_PAGE  →  this file.
// English stays the crawlable source; Chinese is a usability layer.
(function () {
  "use strict";

  var STORAGE_KEY = "fp-lang";

  function detect() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  var common = window.I18N_COMMON || { en: {}, zh: {} };
  var page = window.I18N_PAGE || { en: {}, zh: {} };
  var dict = {
    en: Object.assign({}, common.en, page.en),
    zh: Object.assign({}, common.zh, page.zh),
  };

  var lang = detect();

  function t(key) {
    var table = dict[lang] || {};
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    return dict.en[key] != null ? dict.en[key] : key;
  }

  function setAttrFrom(selector, apply) {
    document.querySelectorAll(selector).forEach(apply);
  }

  function applyTranslations() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

    setAttrFrom("[data-i18n]", function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    setAttrFrom("[data-i18n-html]", function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    setAttrFrom("[data-i18n-ph]", function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    setAttrFrom("[data-i18n-aria]", function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    setAttrFrom("[data-lang-btn]", function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    });

    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: lang } }));
  }

  function setLang(next) {
    if (next !== "en" && next !== "zh" || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    applyTranslations();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang-btn]");
    if (!btn) return;
    e.preventDefault();
    setLang(btn.getAttribute("data-lang-btn"));
  });

  window.i18n = {
    get lang() { return lang; },
    t: t,
    setLang: setLang,
    apply: applyTranslations,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTranslations);
  } else {
    applyTranslations();
  }
})();

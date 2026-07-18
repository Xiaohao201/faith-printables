// Wires the reading-plan form to the pure plan generator and renders results.
(function () {
  "use strict";

  const form = document.querySelector("[data-plan-form]");
  const durationSelect = document.querySelector("[data-duration]");
  const customDaysField = document.querySelector("[data-custom-days-field]");
  const customDaysInput = document.querySelector("[data-custom-days]");
  const errorBox = document.querySelector("[data-error]");
  const resultSection = document.querySelector("[data-result]");
  const summaryBox = document.querySelector("[data-summary]");
  const tableBody = document.querySelector("[data-plan-body]");
  const printBtn = document.querySelector("[data-print]");

  if (!form) return;

  function currentLang() {
    return window.i18n ? window.i18n.lang : "en";
  }
  function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }
  function clearError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  // Translate a plan.js error via its code; fall back to its English message.
  function errorMessage(error) {
    if (!error.code) return error.message;
    if (error.code === "too_many_days" && error.params) {
      return t("err.too_many_days")
        .replace("{chapters}", error.params.chapters)
        .replace("{days}", error.params.days);
    }
    const key = "err." + error.code;
    const translated = t(key);
    return translated === key ? error.message : translated;
  }

  // Read a date input as a local date (avoids UTC off-by-one from new Date(str)).
  function parseLocalDate(value) {
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  function resolveDays() {
    if (durationSelect.value === "custom") return Number(customDaysInput.value);
    return Number(durationSelect.value);
  }

  function renderSummary(meta) {
    const scope = t("scope." + meta.scopeKey);
    const rhythm = meta.daysPerWeek === 6 ? t("rhythm.six") : t("rhythm.every");
    summaryBox.textContent = t("summary.tpl")
      .replace("{scope}", scope)
      .replace("{days}", meta.days)
      .replace("{perDay}", meta.perDay)
      .replace("{rhythm}", rhythm)
      .replace("{start}", meta.startLabel)
      .replace("{end}", meta.endLabel);
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderRows(rows) {
    tableBody.innerHTML = rows
      .map(
        (r) =>
          `<tr><td class="check-cell"><span class="checkbox" aria-hidden="true"></span></td>` +
          `<td>${r.day}</td><td>${r.date}</td><td>${escapeHtml(r.reading)}</td></tr>`
      )
      .join("");
  }

  function generate() {
    clearError();
    try {
      const data = new FormData(form);
      const plan = generatePlan({
        scope: data.get("scope"),
        startDate: parseLocalDate(data.get("startDate")),
        days: resolveDays(),
        daysPerWeek: Number(data.get("daysPerWeek")),
        lang: currentLang(),
      });
      renderSummary(plan.meta);
      renderRows(plan.rows);
      resultSection.hidden = false;
      return true;
    } catch (error) {
      showError(errorMessage(error));
      resultSection.hidden = true;
      return false;
    }
  }

  durationSelect.addEventListener("change", () => {
    customDaysField.hidden = durationSelect.value !== "custom";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (generate()) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Rebuild the shown plan in the newly selected language.
  document.addEventListener("i18n:changed", () => {
    if (!resultSection.hidden) generate();
  });

  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Default the start date to today for convenience.
  const startInput = form.querySelector("[name='startDate']");
  if (startInput && !startInput.value) {
    const today = new Date();
    startInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
  }
})();

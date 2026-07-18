// Wires the prayer-sheet form to the pure builder and renders a printable sheet.
(function () {
  "use strict";

  const form = document.querySelector("[data-prayer-form]");
  const templateSelect = document.querySelector("[data-template]");
  const groups = Array.from(document.querySelectorAll("[data-group]"));
  const focusInputs = Array.from(document.querySelectorAll("[data-focus]"));
  const rowsInput = document.querySelector("[data-rows]");
  const titleInput = document.querySelector("[name='title']");
  const errorBox = document.querySelector("[data-error]");
  const resultSection = document.querySelector("[data-result]");
  const output = document.querySelector("[data-prayer-output]");
  const printBtn = document.querySelector("[data-print]");

  if (!form) return;

  function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  // Show only the option group relevant to the chosen template.
  function syncGroups() {
    groups.forEach((g) => {
      g.hidden = g.getAttribute("data-group") !== templateSelect.value;
    });
  }

  // Fill focus inputs with the current language's defaults unless edited by hand.
  focusInputs.forEach((inp) => {
    inp.addEventListener("input", () => { inp.dataset.edited = "1"; });
  });
  function applyFocusDefaults() {
    focusInputs.forEach((inp, i) => {
      if (inp.dataset.edited !== "1") inp.value = t("pr.focus." + i);
    });
  }

  function headerHtml(sheet) {
    if (!sheet.showHeader) return "";
    return (
      `<div class="hw-header"><span>${escapeHtml(t("pr.name"))}</span>` +
      `<span>${escapeHtml(t("pr.date"))}</span></div>`
    );
  }

  function renderWeekly(sheet) {
    const days = sheet.days
      .map(
        (d, i) =>
          `<div class="pr-day"><div class="pr-day-head">` +
          `<span class="pr-day-name">${escapeHtml(t("pr.day." + i))}</span>` +
          `<span class="pr-day-focus">${escapeHtml(d.focus)}</span></div>` +
          `<div class="hw-blanks" style="--n:2"></div></div>`
      )
      .join("");
    return `<div class="pr-weekly">${days}</div>`;
  }

  function renderTracker(sheet) {
    const rows = Array.from({ length: sheet.rows })
      .map(() => `<tr><td></td><td></td><td></td></tr>`)
      .join("");
    return (
      `<table class="pr-table"><thead><tr>` +
      `<th class="pr-col-date">${escapeHtml(t("pr.col.date"))}</th>` +
      `<th>${escapeHtml(t("pr.col.request"))}</th>` +
      `<th class="pr-col-ans">${escapeHtml(t("pr.col.answered"))}</th></tr></thead>` +
      `<tbody>${rows}</tbody></table>`
    );
  }

  function renderJournal(sheet) {
    return sheet.sections
      .map(
        (s, i) =>
          `<div class="pr-section"><div class="pr-section-title">${escapeHtml(t("pr.section." + i))}</div>` +
          `<div class="hw-blanks" style="--n:${s.lines}"></div></div>`
      )
      .join("");
  }

  function render(sheet) {
    const body =
      sheet.template === "tracker"
        ? renderTracker(sheet)
        : sheet.template === "journal"
        ? renderJournal(sheet)
        : renderWeekly(sheet);

    output.innerHTML =
      `<div class="prayer-sheet">${headerHtml(sheet)}` +
      `<div class="pr-title">${escapeHtml(sheet.title)}</div>${body}</div>`;
  }

  let lastSheet = null;

  function generate() {
    errorBox.hidden = true;
    try {
      const data = new FormData(form);
      const template = data.get("template");
      const title = (data.get("title") || "").trim() || t("pr.title.default." + template);
      lastSheet = buildPrayerSheet({
        template: template,
        title: title,
        showHeader: data.get("showHeader") === "on",
        focuses: focusInputs.map((input) => input.value),
        rows: rowsInput ? rowsInput.value : undefined,
      });
      render(lastSheet);
      resultSection.hidden = false;
      return true;
    } catch (error) {
      showError(error.message || "Something went wrong. Please check your inputs.");
      resultSection.hidden = true;
      lastSheet = null;
      return false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (generate()) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  templateSelect.addEventListener("change", syncGroups);

  // On language switch: refresh default focuses and re-render the sheet.
  document.addEventListener("i18n:changed", () => {
    applyFocusDefaults();
    if (lastSheet) generate();
  });

  if (printBtn) printBtn.addEventListener("click", () => window.print());

  syncGroups();
  applyFocusDefaults();
})();

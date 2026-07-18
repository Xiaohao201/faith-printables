// Wires the memory-card form to the pure card planner and renders printable cards.
(function () {
  "use strict";

  const form = document.querySelector("[data-card-form]");
  const rowsBox = document.querySelector("[data-verse-rows]");
  const addBtn = document.querySelector("[data-add-verse]");
  const errorBox = document.querySelector("[data-error]");
  const resultSection = document.querySelector("[data-result]");
  const captionBox = document.querySelector("[data-caption]");
  const output = document.querySelector("[data-cards-output]");
  const printBtn = document.querySelector("[data-print]");

  if (!form) return;

  function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Build one editable verse row. Returns the row element.
  function makeRow(reference, text) {
    const row = document.createElement("div");
    row.className = "verse-row";
    row.innerHTML =
      `<input type="text" class="verse-ref">` +
      `<textarea class="verse-text" rows="2"></textarea>` +
      `<button type="button" class="row-remove">✕</button>`;
    row.querySelector(".verse-ref").value = reference || "";
    row.querySelector(".verse-text").value = text || "";
    localizeRow(row);
    row.querySelector(".row-remove").addEventListener("click", () => {
      row.remove();
      if (!rowsBox.querySelector(".verse-row")) addRow("", "");
    });
    return row;
  }

  function localizeRow(row) {
    row.querySelector(".verse-ref").setAttribute("placeholder", t("mc.ph.ref"));
    const ta = row.querySelector(".verse-text");
    ta.setAttribute("placeholder", t("mc.ph.text"));
    ta.setAttribute("aria-label", t("mc.aria.text"));
    row.querySelector(".verse-ref").setAttribute("aria-label", t("mc.aria.ref"));
    row.querySelector(".row-remove").setAttribute("aria-label", t("mc.aria.remove"));
    row.querySelector(".row-remove").setAttribute("title", t("mc.aria.remove"));
  }

  function addRow(reference, text) {
    rowsBox.appendChild(makeRow(reference, text));
  }

  function readVerses() {
    return Array.from(rowsBox.querySelectorAll(".verse-row")).map((row) => ({
      reference: row.querySelector(".verse-ref").value,
      text: row.querySelector(".verse-text").value,
    }));
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function errorMessage(error) {
    if (!error.code) return error.message;
    const key = "mc.err." + error.code;
    const translated = t(key);
    return translated === key ? error.message : translated;
  }

  function renderCard(verse, cardType, translation) {
    const ref = escapeHtml(verse.reference);
    const text = escapeHtml(verse.text);
    const trans = translation ? `<div class="mc-trans">${escapeHtml(translation)}</div>` : "";

    if (cardType === "fold") {
      return (
        `<div class="mc-card mc-fold">` +
        `<div class="mc-half mc-back"><div class="mc-text">${text}</div>${trans}</div>` +
        `<div class="mc-foldline" aria-hidden="true"></div>` +
        `<div class="mc-half mc-front"><div class="mc-ref">${ref}</div></div>` +
        `</div>`
      );
    }
    return (
      `<div class="mc-card">` +
      `<div class="mc-ref">${ref}</div>` +
      `<div class="mc-text">${text}</div>${trans}` +
      `</div>`
    );
  }

  let lastPlan = null;

  function render(plan) {
    const gridClass = plan.perPage === 8 ? "mc-grid-8" : "mc-grid-4";
    output.innerHTML = plan.pages
      .map((pageVerses) => {
        const cards = pageVerses
          .map((v) => renderCard(v, plan.cardType, plan.translation))
          .join("");
        return `<div class="mc-page ${gridClass}">${cards}</div>`;
      })
      .join("");

    const type = t(plan.cardType === "fold" ? "mc.type.fold" : "mc.type.full");
    captionBox.textContent = t("mc.caption")
      .replace("{count}", plan.count)
      .replace("{type}", type)
      .replace("{pages}", plan.pages.length);
  }

  function generate() {
    errorBox.hidden = true;
    try {
      const data = new FormData(form);
      lastPlan = buildCardPlan({
        verses: readVerses(),
        size: data.get("size"),
        cardType: data.get("cardType"),
        translation: data.get("translation"),
      });
      render(lastPlan);
      resultSection.hidden = false;
      return true;
    } catch (error) {
      showError(errorMessage(error));
      resultSection.hidden = true;
      lastPlan = null;
      return false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (generate()) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  addBtn.addEventListener("click", () => {
    addRow("", "");
    const rows = rowsBox.querySelectorAll(".verse-row");
    rows[rows.length - 1].querySelector(".verse-ref").focus();
  });

  // On language switch: re-localize row placeholders and re-render the caption.
  document.addEventListener("i18n:changed", () => {
    rowsBox.querySelectorAll(".verse-row").forEach(localizeRow);
    if (lastPlan) render(lastPlan);
  });

  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Pre-load sample verses so the page shows its value immediately.
  SAMPLE_VERSES.forEach((v) => addRow(v.reference, v.text));
})();

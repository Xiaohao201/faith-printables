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

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Build one editable verse row. Returns the row element.
  function makeRow(reference, text) {
    const row = document.createElement("div");
    row.className = "verse-row";
    row.innerHTML =
      `<input type="text" class="verse-ref" placeholder="Reference (e.g. John 3:16)" aria-label="Verse reference">` +
      `<textarea class="verse-text" rows="2" placeholder="Verse text — paste from your Bible or app" aria-label="Verse text"></textarea>` +
      `<button type="button" class="row-remove" aria-label="Remove this verse" title="Remove">✕</button>`;
    row.querySelector(".verse-ref").value = reference || "";
    row.querySelector(".verse-text").value = text || "";
    row.querySelector(".row-remove").addEventListener("click", () => {
      row.remove();
      if (!rowsBox.querySelector(".verse-row")) addRow("", "");
    });
    return row;
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

  function render(plan) {
    const gridClass = plan.perPage === 8 ? "mc-grid-8" : "mc-grid-4";
    const html = plan.pages
      .map((pageVerses) => {
        const cards = pageVerses
          .map((v) => renderCard(v, plan.cardType, plan.translation))
          .join("");
        return `<div class="mc-page ${gridClass}">${cards}</div>`;
      })
      .join("");
    output.innerHTML = html;

    const pageWord = plan.pages.length === 1 ? "page" : "pages";
    const typeWord = plan.cardType === "fold" ? "fold-over" : "full";
    captionBox.textContent =
      `${plan.count} ${typeWord} card${plan.count === 1 ? "" : "s"} across ` +
      `${plan.pages.length} ${pageWord}. Print, then cut along the card borders.`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    try {
      const data = new FormData(form);
      const plan = buildCardPlan({
        verses: readVerses(),
        size: data.get("size"),
        cardType: data.get("cardType"),
        translation: data.get("translation"),
      });
      render(plan);
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showError(error.message || "Something went wrong. Please check your verses.");
      resultSection.hidden = true;
    }
  });

  addBtn.addEventListener("click", () => {
    addRow("", "");
    const rows = rowsBox.querySelectorAll(".verse-row");
    rows[rows.length - 1].querySelector(".verse-ref").focus();
  });

  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Pre-load sample verses so the page shows its value immediately.
  SAMPLE_VERSES.forEach((v) => addRow(v.reference, v.text));
})();

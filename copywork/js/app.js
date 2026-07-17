// Wires the copywork form to the pure worksheet builder and renders a printable sheet.
(function () {
  "use strict";

  const form = document.querySelector("[data-worksheet-form]");
  const styleSelect = document.querySelector("[data-style]");
  const countInput = document.querySelector("[data-count]");
  const countLabel = document.querySelector("[data-count-label]");
  const errorBox = document.querySelector("[data-error]");
  const resultSection = document.querySelector("[data-result]");
  const output = document.querySelector("[data-worksheet-output]");
  const printBtn = document.querySelector("[data-print]");

  if (!form) return;

  const SIZE_CLASS = { large: "hw-lg", medium: "hw-md", small: "hw-sm" };

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  // Keep the count label meaningful as the style changes.
  function syncCountLabel() {
    countLabel.textContent =
      styleSelect.value === "copy" ? "Blank practice lines" : "Times to repeat";
  }

  function render(ws) {
    const parts = [`<div class="worksheet ${SIZE_CLASS[ws.size]}">`];

    if (ws.showHeader) {
      parts.push(
        `<div class="hw-header"><span>Name: ____________________</span>` +
          `<span>Date: ____________</span></div>`
      );
    }
    if (ws.reference) {
      parts.push(`<div class="hw-title">${escapeHtml(ws.reference)}</div>`);
    }

    const text = escapeHtml(ws.text);
    if (ws.style === "trace") {
      for (let i = 0; i < ws.count; i += 1) {
        parts.push(`<div class="hw-block trace">${text}</div>`);
      }
    } else {
      parts.push(`<div class="hw-block model">${text}</div>`);
      parts.push(`<div class="hw-blanks" style="--n:${ws.count}"></div>`);
    }

    parts.push(`</div>`);
    output.innerHTML = parts.join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    try {
      const data = new FormData(form);
      const ws = buildWorksheet({
        reference: data.get("reference"),
        text: data.get("text"),
        style: data.get("style"),
        size: data.get("size"),
        count: data.get("count"),
        showHeader: data.get("showHeader") === "on",
      });
      render(ws);
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showError(error.message || "Something went wrong. Please check your inputs.");
      resultSection.hidden = true;
    }
  });

  styleSelect.addEventListener("change", syncCountLabel);
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  syncCountLabel();
})();

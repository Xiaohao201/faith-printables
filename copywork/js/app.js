// Wires the copywork form to the pure worksheet builder and renders a printable sheet.
(function () {
  "use strict";

  const form = document.querySelector("[data-worksheet-form]");
  const styleSelect = document.querySelector("[data-style]");
  const countLabel = document.querySelector("[data-count-label]");
  const errorBox = document.querySelector("[data-error]");
  const resultSection = document.querySelector("[data-result]");
  const output = document.querySelector("[data-worksheet-output]");
  const printBtn = document.querySelector("[data-print]");

  if (!form) return;

  const SIZE_CLASS = { large: "hw-lg", medium: "hw-md", small: "hw-sm" };

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

  function errorMessage(error) {
    if (!error.code) return error.message;
    const key = "cw.err." + error.code;
    const translated = t(key);
    return translated === key ? error.message : translated;
  }

  // Keep the count label meaningful as the style changes.
  function syncCountLabel() {
    countLabel.textContent =
      styleSelect.value === "copy" ? t("cw.count.copy") : t("cw.count.repeat");
  }

  function render(ws) {
    const parts = [`<div class="worksheet ${SIZE_CLASS[ws.size]}">`];

    if (ws.showHeader) {
      parts.push(
        `<div class="hw-header"><span>${escapeHtml(t("cw.name"))}</span>` +
          `<span>${escapeHtml(t("cw.date"))}</span></div>`
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

  let lastWs = null;

  function generate() {
    errorBox.hidden = true;
    try {
      const data = new FormData(form);
      lastWs = buildWorksheet({
        reference: data.get("reference"),
        text: data.get("text"),
        style: data.get("style"),
        size: data.get("size"),
        count: data.get("count"),
        showHeader: data.get("showHeader") === "on",
      });
      render(lastWs);
      resultSection.hidden = false;
      return true;
    } catch (error) {
      showError(errorMessage(error));
      resultSection.hidden = true;
      lastWs = null;
      return false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (generate()) resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  styleSelect.addEventListener("change", syncCountLabel);

  // On language switch: update the count label and re-render the sheet header.
  document.addEventListener("i18n:changed", () => {
    syncCountLabel();
    if (lastWs) render(lastWs);
  });

  if (printBtn) printBtn.addEventListener("click", () => window.print());

  syncCountLabel();
})();

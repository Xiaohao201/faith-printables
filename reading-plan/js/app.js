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

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  // Read a date input as a local date (avoids UTC off-by-one from new Date(str)).
  function parseLocalDate(value) {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  function resolveDays() {
    if (durationSelect.value === "custom") {
      return Number(customDaysInput.value);
    }
    return Number(durationSelect.value);
  }

  function renderSummary(meta) {
    const rhythm = meta.daysPerWeek === 6 ? "6 days a week (Sundays off)" : "every day";
    summaryBox.textContent =
      `${meta.scopeLabel} in ${meta.days} readings · ${meta.perDay} chapters per reading, ` +
      `${rhythm} · ${meta.startLabel} – ${meta.endLabel}`;
  }

  function renderRows(rows) {
    const html = rows
      .map(
        (r) =>
          `<tr><td class="check-cell"><span class="checkbox" aria-hidden="true"></span></td>` +
          `<td>${r.day}</td><td>${r.date}</td><td>${escapeHtml(r.reading)}</td></tr>`
      )
      .join("");
    tableBody.innerHTML = html;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  durationSelect.addEventListener("change", () => {
    customDaysField.hidden = durationSelect.value !== "custom";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();

    try {
      const data = new FormData(form);
      const startDate = parseLocalDate(data.get("startDate"));

      const plan = generatePlan({
        scope: data.get("scope"),
        startDate,
        days: resolveDays(),
        daysPerWeek: Number(data.get("daysPerWeek")),
      });

      renderSummary(plan.meta);
      renderRows(plan.rows);
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showError(error.message || "Something went wrong. Please check your inputs.");
      resultSection.hidden = true;
    }
  });

  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  // Default the start date to today for convenience.
  const startInput = form.querySelector("[name='startDate']");
  if (startInput && !startInput.value) {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    startInput.value = iso;
  }
})();

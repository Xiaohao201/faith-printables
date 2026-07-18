// Pure functions that turn a set of options into a printable reading plan.
// No DOM, no mutation of inputs — everything returns fresh objects.

const MAX_DAYS = 1500;
const MIN_DAYS = 1;

// Errors carry a `code` (and optional `params`) so the UI can translate them.
function planError(code, message, params) {
  const err = new Error(message);
  err.code = code;
  if (params) err.params = params;
  return err;
}

// Expand the chosen books into a flat, ordered list of chapter units.
function buildChapterUnits(books) {
  return books.reduce((units, book) => {
    const chapters = Array.from({ length: book.chapters }, (_, i) => ({
      book: book.name,
      zh: book.zh,
      chapter: i + 1,
    }));
    return units.concat(chapters);
  }, []);
}

// Split `total` items across `days` as evenly as possible.
// Returns an array of per-day counts. Extra items land on the earliest days.
function distribute(total, days) {
  const base = Math.floor(total / days);
  const remainder = total % days;
  return Array.from({ length: days }, (_, i) => (i < remainder ? base + 1 : base));
}

// Slice the ordered units into one array per day, following per-day counts.
function assignReadings(units, perDayCounts) {
  let cursor = 0;
  return perDayCounts.map((count) => {
    const slice = units.slice(cursor, cursor + count);
    cursor += count;
    return slice;
  });
}

// Produce the calendar dates a reader will use, starting at `startDate`.
// daysPerWeek 6 skips Sundays (a common rest / catch-up day); 7 uses every day.
function generateDates(startDate, days, daysPerWeek) {
  const dates = [];
  const cursor = new Date(startDate.getTime());
  while (dates.length < days) {
    const isSunday = cursor.getDay() === 0;
    if (daysPerWeek === 7 || !isSunday) {
      dates.push(new Date(cursor.getTime()));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Collapse a day's chapter units into a compact human reference,
// e.g. [{Genesis,1},{Genesis,2},{Genesis,3}] -> "Genesis 1–3".
function formatReadings(dayUnits, lang) {
  if (dayUnits.length === 0) return "—";
  const groups = dayUnits.reduce((acc, unit) => {
    const last = acc[acc.length - 1];
    if (last && last.book === unit.book && unit.chapter === last.end + 1) {
      return acc.slice(0, -1).concat({ ...last, end: unit.chapter });
    }
    return acc.concat({ book: unit.book, zh: unit.zh, start: unit.chapter, end: unit.chapter });
  }, []);

  return groups
    .map((g) => {
      const name = lang === "zh" ? g.zh : g.book;
      return g.start === g.end ? `${name} ${g.start}` : `${name} ${g.start}–${g.end}`;
    })
    .join(lang === "zh" ? "，" : ", ");
}

const DATE_FORMAT = { year: "numeric", month: "short", day: "numeric" };

function formatDate(date, locale) {
  return date.toLocaleDateString(locale || "en-US", DATE_FORMAT);
}

// Main entry point. Validates options and returns a plan or throws a
// user-friendly Error. Options: { scope, startDate (Date), days (number),
// daysPerWeek (6|7) }.
function generatePlan(options) {
  const scope = PLAN_SCOPES[options.scope];
  if (!scope) {
    throw planError("scope", "Please choose a valid reading scope.");
  }
  if (!(options.startDate instanceof Date) || Number.isNaN(options.startDate.getTime())) {
    throw planError("date", "Please pick a valid start date.");
  }

  const days = Math.round(options.days);
  if (!Number.isFinite(days) || days < MIN_DAYS || days > MAX_DAYS) {
    throw planError("days_range", `Number of days must be between ${MIN_DAYS} and ${MAX_DAYS}.`);
  }

  const daysPerWeek = options.daysPerWeek === 6 ? 6 : 7;
  const lang = options.lang === "zh" ? "zh" : "en";
  const locale = lang === "zh" ? "zh-CN" : "en-US";

  const books = BIBLE_BOOKS.filter(scope.filter);
  const units = buildChapterUnits(books);

  if (units.length === 0) {
    throw planError("no_chapters", "The selected scope has no chapters to schedule.");
  }
  if (days > units.length) {
    throw planError(
      "too_many_days",
      `That scope has only ${units.length} chapters, so it can't be spread over ${days} days. Try fewer days.`,
      { chapters: units.length, days }
    );
  }

  const perDayCounts = distribute(units.length, days);
  const readings = assignReadings(units, perDayCounts);
  const dates = generateDates(options.startDate, days, daysPerWeek);

  const rows = readings.map((dayUnits, i) => ({
    day: i + 1,
    date: formatDate(dates[i], locale),
    reading: formatReadings(dayUnits, lang),
  }));

  const perDay = (units.length / days).toFixed(1);
  const meta = {
    scopeKey: options.scope,
    scopeLabel: scope.label,
    totalChapters: units.length,
    days,
    perDay,
    daysPerWeek,
    startLabel: formatDate(dates[0], locale),
    endLabel: formatDate(dates[dates.length - 1], locale),
  };

  return { meta, rows };
}

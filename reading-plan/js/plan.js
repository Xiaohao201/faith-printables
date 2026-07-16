// Pure functions that turn a set of options into a printable reading plan.
// No DOM, no mutation of inputs — everything returns fresh objects.

const MAX_DAYS = 1500;
const MIN_DAYS = 1;

// Expand the chosen books into a flat, ordered list of chapter units.
function buildChapterUnits(books) {
  return books.reduce((units, book) => {
    const chapters = Array.from({ length: book.chapters }, (_, i) => ({
      book: book.name,
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
function formatReadings(dayUnits) {
  if (dayUnits.length === 0) return "—";
  const groups = dayUnits.reduce((acc, unit) => {
    const last = acc[acc.length - 1];
    if (last && last.book === unit.book && unit.chapter === last.end + 1) {
      return acc.slice(0, -1).concat({ ...last, end: unit.chapter });
    }
    return acc.concat({ book: unit.book, start: unit.chapter, end: unit.chapter });
  }, []);

  return groups
    .map((g) => (g.start === g.end ? `${g.book} ${g.start}` : `${g.book} ${g.start}–${g.end}`))
    .join(", ");
}

const DATE_FORMAT = { year: "numeric", month: "short", day: "numeric" };

function formatDate(date) {
  return date.toLocaleDateString("en-US", DATE_FORMAT);
}

// Main entry point. Validates options and returns a plan or throws a
// user-friendly Error. Options: { scope, startDate (Date), days (number),
// daysPerWeek (6|7) }.
function generatePlan(options) {
  const scope = PLAN_SCOPES[options.scope];
  if (!scope) {
    throw new Error("Please choose a valid reading scope.");
  }
  if (!(options.startDate instanceof Date) || Number.isNaN(options.startDate.getTime())) {
    throw new Error("Please pick a valid start date.");
  }

  const days = Math.round(options.days);
  if (!Number.isFinite(days) || days < MIN_DAYS || days > MAX_DAYS) {
    throw new Error(`Number of days must be between ${MIN_DAYS} and ${MAX_DAYS}.`);
  }

  const daysPerWeek = options.daysPerWeek === 6 ? 6 : 7;

  const books = BIBLE_BOOKS.filter(scope.filter);
  const units = buildChapterUnits(books);

  if (units.length === 0) {
    throw new Error("The selected scope has no chapters to schedule.");
  }
  if (days > units.length) {
    throw new Error(
      `That scope has only ${units.length} chapters, so it can't be spread over ${days} days. Try fewer days.`
    );
  }

  const perDayCounts = distribute(units.length, days);
  const readings = assignReadings(units, perDayCounts);
  const dates = generateDates(options.startDate, days, daysPerWeek);

  const rows = readings.map((dayUnits, i) => ({
    day: i + 1,
    date: formatDate(dates[i]),
    reading: formatReadings(dayUnits),
  }));

  const perDay = (units.length / days).toFixed(1);
  const meta = {
    scopeLabel: scope.label,
    totalChapters: units.length,
    days,
    perDay,
    daysPerWeek,
    startLabel: formatDate(dates[0]),
    endLabel: formatDate(dates[dates.length - 1]),
  };

  return { meta, rows };
}

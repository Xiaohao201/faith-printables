// Pure logic for the prayer list / journal generator. Returns a normalized
// sheet config or throws a user-friendly Error.

const PRAYER_TEMPLATES = ["weekly", "tracker", "journal"];

const WEEK_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// Sensible defaults for the weekly focus, editable by the user.
const DEFAULT_FOCUSES = [
  "Family",
  "My Church",
  "Missions & the Persecuted",
  "Our Nation & Leaders",
  "Friends & Neighbours",
  "The Lost",
  "Praise & Thanksgiving",
];

// Fixed sections for the journal template: title + how many ruled lines.
const JOURNAL_SECTIONS = [
  { title: "Praise & Thanksgiving", lines: 4 },
  { title: "Prayer Requests", lines: 9 },
  { title: "Answered Prayers", lines: 4 },
  { title: "A Verse for Today", lines: 2 },
];

const DEFAULT_TITLES = {
  weekly: "Weekly Prayer Focus",
  tracker: "Prayer Requests",
  journal: "Prayer Journal",
};

function buildPrayerSheet(options) {
  const template = PRAYER_TEMPLATES.includes(options.template) ? options.template : "weekly";
  const title = (options.title || "").trim() || DEFAULT_TITLES[template];
  const showHeader = options.showHeader !== false;

  const sheet = { template, title, showHeader };

  if (template === "weekly") {
    const provided = Array.isArray(options.focuses) ? options.focuses : [];
    sheet.days = WEEK_DAYS.map((day, i) => ({
      day,
      focus: (provided[i] || "").trim() || DEFAULT_FOCUSES[i],
    }));
  } else if (template === "tracker") {
    let rows = Math.round(Number(options.rows));
    if (!Number.isFinite(rows) || rows < 1) rows = 12;
    sheet.rows = Math.min(rows, 40);
  } else {
    sheet.sections = JOURNAL_SECTIONS.map((s) => ({ ...s }));
  }

  return sheet;
}

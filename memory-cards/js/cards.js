// Pure functions that turn a list of verses + options into a paginated
// card plan. No DOM, no mutation of inputs.

// Drop blank rows and trim. A row counts if it has a reference or some text.
function normalizeVerses(rawVerses) {
  return rawVerses
    .map((v) => ({
      reference: (v.reference || "").trim(),
      text: (v.text || "").trim(),
    }))
    .filter((v) => v.reference !== "" || v.text !== "");
}

// Split an array into pages of at most `size` items.
function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

// Main entry point. Returns { pages, count, perPage, cardType, translation }
// or throws a user-friendly Error.
function buildCardPlan(options) {
  const perPage = CARDS_PER_PAGE[options.size] || CARDS_PER_PAGE.large;
  const cardType = options.cardType === "fold" ? "fold" : "full";
  const translation = (options.translation || "").trim();

  const verses = normalizeVerses(options.verses || []);
  if (verses.length === 0) {
    throw new Error("Add at least one verse (a reference or some text) to make cards.");
  }

  if (cardType === "fold") {
    const missing = verses.find((v) => v.reference === "" || v.text === "");
    if (missing) {
      throw new Error(
        "Fold-over cards need both a reference and verse text for every card " +
          "(the reference goes on the front, the text on the back)."
      );
    }
  }

  return {
    pages: chunk(verses, perPage),
    count: verses.length,
    perPage,
    cardType,
    translation,
  };
}

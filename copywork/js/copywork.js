// Pure logic for the copywork / handwriting worksheet. Validates options and
// returns a normalized worksheet config, or throws a user-friendly Error.

const WORKSHEET_STYLES = ["trace", "copy"];
const WORKSHEET_SIZES = ["large", "medium", "small"];
const MAX_COUNT = 30;

function buildWorksheet(options) {
  const text = (options.text || "").trim();
  if (text === "") {
    throw new Error("Add the verse text you'd like on the worksheet.");
  }

  const reference = (options.reference || "").trim();
  const style = WORKSHEET_STYLES.includes(options.style) ? options.style : "trace";
  const size = WORKSHEET_SIZES.includes(options.size) ? options.size : "large";

  let count = Math.round(Number(options.count));
  if (!Number.isFinite(count) || count < 1) {
    count = style === "trace" ? 3 : 6;
  }
  count = Math.min(count, MAX_COUNT);

  const showHeader = options.showHeader !== false;

  return { reference, text, style, size, count, showHeader };
}

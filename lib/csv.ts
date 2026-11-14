/**
 * Sanitizes an individual cell value:
 * 1. Converts null/undefined to empty string.
 * 2. Preserves legitimate numeric values (e.g. -50, 100, "-42").
 * 3. Defends against CSV Formula Injection (DDE) by prefixing dangerous triggers (=, +, -, @) with a single quote.
 * 4. Escapes characters per RFC 4180 (wraps in double quotes if containing quotes, commas, or newlines).
 */
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === "boolean") return String(val);

  if (typeof val === "number") {
    return Number.isFinite(val) ? String(val) : '""';
  }

  let str = String(val);

  // Check if string is a valid finite numeric string (e.g., "-50", "123.45")
  const trimmed = str.trim();
  const isNumeric = trimmed !== "" && !isNaN(Number(trimmed));

  // If the string consists purely of digits with >= 10 digits, or has a leading zero:
  // wrap as ="..." so spreadsheet applications (Excel) display it as verbatim text
  // instead of converting it to scientific notation (e.g., 5.54468E+11) or stripping leading zeros.
  if (/^\d{10,}$/.test(trimmed) || /^0\d+$/.test(trimmed)) {
    return `="${trimmed}"`;
  }

  // Formula injection check: starts with =, @, or (+ / - when not a plain number),
  // accounting for leading whitespace or control characters
  if (!isNumeric) {
    const hasFormulaTrigger = /^[\s\x00-\x1F]*[=@+-]/.test(str);
    if (hasFormulaTrigger) {
      str = "'" + str;
    }
  } else if (/^[\s\x00-\x1F]*[=@]/.test(str)) {
    // String like "=123" evaluates as numeric in isNaN, but starts with =
    str = "'" + str;
  }

  // RFC 4180 Escaping: wrap in double quotes if contains commas, double quotes, or newlines
  const needsQuotes =
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith("'");
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Builds complete CSV content with UTF-8 BOM (\uFEFF)
 */
export function buildCsvContent(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  return "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
}

/**
 * Formats a date value consistently in ISO standard format (YYYY-MM-DD).
 * Prevents Excel locale ambiguity where dates with day <= 12 are inverted and days > 12 are treated as raw text.
 */
export function formatExportDate(val: unknown): string {
  if (!val) return "";
  try {
    const d = new Date(val as string | number | Date);
    return isNaN(d.getTime()) ? String(val) : d.toISOString().slice(0, 10);
  } catch {
    return String(val);
  }
}

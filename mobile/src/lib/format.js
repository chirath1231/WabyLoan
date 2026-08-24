/** Formats a number as grouped-thousands LKR currency, e.g. 1234567 -> "LKR 1,234,567". */
export function fmtLkr(n) {
  const value = Math.round(Number(n) || 0);
  const negative = value < 0;
  const digits = Math.abs(value).toString();
  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    const posFromEnd = digits.length - i;
    grouped += digits[i];
    if (posFromEnd > 1 && posFromEnd % 3 === 1) grouped += ',';
  }
  return `LKR ${negative ? '-' : ''}${grouped}`;
}

/** Parses free-typed money input ("1,234.50") into a plain number, defaulting to 0. */
export function parseMoney(text) {
  const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

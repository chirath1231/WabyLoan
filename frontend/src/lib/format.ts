export function fmtLkr(n: number | null | undefined): string {
  return `LKR ${Math.round(n ?? 0).toLocaleString('en-LK')}`;
}

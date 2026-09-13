export function fmt(n) {
  return 'LKR ' + Math.round(n || 0).toLocaleString('en-LK');
}

export function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('en-LK');
}

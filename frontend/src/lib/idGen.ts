let counter = 0;

/** Simple client-side id generator for dynamically-added itemized rows (not persisted as-is). */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}

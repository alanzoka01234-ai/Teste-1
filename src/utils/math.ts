export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function len(x: number, y: number) { return Math.hypot(x, y); }
export function norm(x: number, y: number) {
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d, d };
}

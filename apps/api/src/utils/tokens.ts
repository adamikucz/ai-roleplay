export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}
export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
export function compact(text: string, max = 420) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}
export function nowIso() { return new Date().toISOString(); }

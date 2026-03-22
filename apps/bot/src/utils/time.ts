export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const randBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);
export const jitter = (ms: number, pct = 0.2) => {
  const d = ms * pct;
  return Math.floor(ms + (Math.random() * 2 - 1) * d);
};

// Display persisted seconds in a human-friendly form; stored values remain seconds.
export function formatDuration(seconds) {
  if (seconds === "" || seconds == null) return "";
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return "";
  const whole = Math.floor(n);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  if (h) return [h + " hr", m ? m + " min" : "", s ? s + " sec" : ""].filter(Boolean).join(" ");
  if (m) return [m + " min", s ? s + " sec" : ""].filter(Boolean).join(" ");
  return `${s} sec`;
}

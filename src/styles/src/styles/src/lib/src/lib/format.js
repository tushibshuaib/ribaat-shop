export function money(value, symbol = "৳") {
  const n = Number(value) || 0;
  return `${symbol}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Falls back to a random slug when the name has no English letters.
export function makeSlug(text) {
  const base = slugify(text);
  const rand = Math.random().toString(36).slice(2, 6);
  return base || `item-${rand}`;
}

export function discountPercent(price, compareAt) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function isValidPhone(value) {
  return /^[0-9+ -]{6,20}$/.test(String(value || "").trim());
}

export const ORDER_STATUSES = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

export function statusBadgeClass(status) {
  if (status === "delivered") return "badge badge-green";
  if (status === "cancelled") return "badge badge-danger";
  if (status === "pending") return "badge badge-warn";
  return "badge";
}

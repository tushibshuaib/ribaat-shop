import { getAdminClient, parseBody, rateLimited, reply } from "./lib/shared.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v, max) => String(v ?? "").trim().slice(0, max);

export const handler = async (event) => {
  const parsed = parseBody(event);
  if (parsed.error) return parsed.error;

  if (rateLimited(event, "order", 8, 10 * 60 * 1000)) {
    return reply(429, { error: "Too many attempts. Please wait a few minutes." });
  }

  const db = getAdminClient();
  if (!db) return reply(500, { error: "The store is not configured yet." });

  const b = parsed.data;
  const rawItems = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length < 1 || rawItems.length > 50) {
    return reply(400, { error: "Your cart is empty." });
  }

  // Only product IDs and quantities are accepted. Prices come from the database.
  const items = [];
  for (const it of rawItems) {
    const qty = Number(it && it.quantity);
    if (!it || !UUID.test(String(it.product_id)) || !Number.isInteger(qty) || qty < 1 || qty > 100) {
      return reply(400, { error: "Invalid cart item." });
    }
    items.push({ product_id: String(it.product_id), quantity: qty });
  }

  const { data, error } = await db.rpc("create_order", {
    p_name: text(b.name, 100),
    p_phone: text(b.phone, 20),
    p_email: text(b.email, 120),
    p_address: text(b.address, 300),
    p_zone: text(b.zone, 10),
    p_notes: text(b.notes, 500),
    p_payment_method: text(b.payment_method, 10),
    p_trx_id: text(b.trx_id, 40),
    p_items: items,
  });

  if (error) {
    // P0001 = a message we raised on purpose in SQL (safe to show).
    if (error.code === "P0001") return reply(400, { error: error.message });
    console.error("create_order failed:", error.code, error.message);
    return reply(500, { error: "Could not place the order. Please try again." });
  }

  return reply(200, { order_number: data.order_number, total: data.total });
};

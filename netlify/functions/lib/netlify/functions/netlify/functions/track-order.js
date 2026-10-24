import { getAdminClient, parseBody, rateLimited, reply } from "./lib/shared.js";

const tail = (v) => String(v || "").replace(/\D/g, "").slice(-10);

export const handler = async (event) => {
  const parsed = parseBody(event);
  if (parsed.error) return parsed.error;

  if (rateLimited(event, "track", 10, 10 * 60 * 1000)) {
    return reply(429, { error: "Too many attempts. Please wait a few minutes." });
  }

  const db = getAdminClient();
  if (!db) return reply(500, { error: "The store is not configured yet." });

  const number = String(parsed.data.order_number || "").trim().toUpperCase();
  const phone = tail(parsed.data.phone);
  if (!/^RB-\d{3,10}$/.test(number) || phone.length < 6) {
    return reply(400, { error: "Enter your order number and phone number." });
  }

  const { data, error } = await db
    .from("orders")
    .select(
      "order_number, status, payment_method, subtotal, delivery_fee, total, created_at, phone, order_items(product_name, unit_price, quantity, line_total)"
    )
    .eq("order_number", number)
    .maybeSingle();

  if (error) {
    console.error("track-order failed:", error.message);
    return reply(500, { error: "Could not look up the order. Please try again." });
  }
  // Same message for a wrong number or a wrong phone, so orders can't be guessed.
  if (!data || tail(data.phone) !== phone) {
    return reply(404, { error: "No order found with these details." });
  }

  const { phone: _hidden, ...safe } = data;
  return reply(200, { order: safe });
};

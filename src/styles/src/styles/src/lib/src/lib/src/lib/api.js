import { supabase } from "./supabase.js";

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function getSettings() {
  return unwrap(await supabase.from("settings").select("*").eq("id", 1).maybeSingle());
}

export async function getBanners() {
  const data = unwrap(
    await supabase.from("banners").select("*").eq("is_active", true)
      .order("sort_order", { ascending: true })
  );
  return data || [];
}

export async function getCategories() {
  const data = unwrap(
    await supabase.from("categories").select("*").eq("is_active", true)
      .order("sort_order", { ascending: true })
  );
  return data || [];
}

const SORTS = {
  newest: ["created_at", false],
  price_asc: ["price", true],
  price_desc: ["price", false],
};

export async function getProducts({ categoryId, search, featured, limit, sort } = {}) {
  let q = supabase
    .from("products")
    .select("*, category:categories(name, slug)")
    .eq("is_active", true);
  if (categoryId) q = q.eq("category_id", categoryId);
  if (featured) q = q.eq("is_featured", true);
  if (search) {
    const term = String(search).trim().replace(/[%_\\]/g, " ");
    if (term) q = q.ilike("name", `%${term}%`);
  }
  const [col, asc] = SORTS[sort] || SORTS.newest;
  q = q.order(col, { ascending: asc });
  if (limit) q = q.limit(limit);
  return unwrap(await q) || [];
}

export async function getProductBySlug(slug) {
  return unwrap(
    await supabase.from("products").select("*, category:categories(name, slug)")
      .eq("slug", slug).eq("is_active", true).maybeSingle()
  );
}

export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  if (!categoryId) return [];
  const data = unwrap(
    await supabase.from("products").select("*").eq("is_active", true)
      .eq("category_id", categoryId).neq("id", excludeId).limit(limit)
  );
  return data || [];
}

async function callFunction(name, body) {
  const res = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// Prices are NOT sent to the server: it re-reads them from the database.
export function placeOrder(payload) {
  return callFunction("create-order", payload);
}

export function trackOrder(orderNumber, phone) {
  return callFunction("track-order", { order_number: orderNumber, phone });
}

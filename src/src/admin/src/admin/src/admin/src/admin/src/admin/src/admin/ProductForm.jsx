import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { makeSlug, slugify } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";
import ImageUpload from "./ImageUpload.jsx";

const EMPTY = {
  name: "", slug: "", category_id: "", price: "", compare_at_price: "",
  stock: "0", low_stock_alert: "5", sku: "", description: "",
  image_url: "", extra_images: [], is_active: true, is_featured: false,
};

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const cats = await supabase.from("categories").select("id, name").order("sort_order");
      if (alive && !cats.error) setCategories(cats.data || []);
      if (editing) {
        const { data, error: err } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (!alive) return;
        if (err || !data) {
          setMissing(true);
        } else {
          setForm({
            name: data.name,
            slug: data.slug,
            category_id: data.category_id || "",
            price: String(data.price),
            compare_at_price: data.compare_at_price == null ? "" : String(data.compare_at_price),
            stock: String(data.stock),
            low_stock_alert: String(data.low_stock_alert),
            sku: data.sku || "",
            description: data.description || "",
            image_url: data.image_url || "",
            extra_images: data.extra_images || [],
            is_active: data.is_active,
            is_featured: data.is_featured,
          });
        }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, editing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCheck = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));
  const addExtra = (url) => { if (url) setForm((f) => ({ ...f, extra_images: [...f.extra_images, url] })); };
  const removeExtra = (url) => setForm((f) => ({ ...f, extra_images: f.extra_images.filter((u) => u !== url) }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const price = Number(form.price);
    const compare = form.compare_at_price === "" ? null : Number(form.compare_at_price);
    const stock = Number(form.stock);
    const low = Number(form.low_stock_alert);

    if (name.length < 2) return setError("Enter a product name.");
    if (form.price === "" || !Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (compare !== null && (!Number.isFinite(compare) || compare <= price)) {
      return setError("Compare-at price must be higher than the price, or leave it empty.");
    }
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number, 0 or more.");
    if (!Number.isInteger(low) || low < 0) return setError("Low-stock alert must be a whole number, 0 or more.");

    const payload = {
      name,
      slug: slugify(form.slug) || makeSlug(name),
      category_id: form.category_id || null,
      price,
      compare_at_price: compare,
      stock,
      low_stock_alert: low,
      sku: form.sku.trim() || null,
      description: form.description.trim(),
      image_url: form.image_url || null,
      extra_images: form.extra_images,
      is_active: form.is_active,
      is_featured: form.is_featured,
    };

    setBusy(true);
    const query = editing
      ? supabase.from("products").update(payload).eq("id", id)
      : supabase.from("products").insert(payload);
    const { error: err } = await query;
    setBusy(false);
    if (err) {
      return setError(err.code === "23505" ? "That URL slug is already used. Change the slug and try again." : err.message);
    }
    navigate("/admin/products");
  }

  if (loading) return <Loader />;
  if (missing) {
    return (
      <div className="stack">
        <h1>Product not found</h1>
        <Link to="/admin/products" className="btn">Back to products</Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="admin-head">
        <h1>{editing ? "Edit product" : "New product"}</h1>
        <Link to="/admin/products" className="btn btn-ghost btn-sm">Cancel</Link>
      </div>

      <div className="card">
        <label className="field"><span>Name *</span>
          <input className="input" value={form.name} onChange={set("name")} maxLength={150} />
        </label>
        <label className="field"><span>URL slug (leave empty to create automatically)</span>
          <input className="input" value={form.slug} onChange={set("slug")} maxLength={80} />
        </label>
        <label className="field"><span>Category</span>
          <select className="input" value={form.category_id} onChange={set("category_id")}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Description</span>
          <textarea className="input" value={form.description} onChange={set("description")} maxLength={5000} />
        </label>
      </div>

      <div className="card">
        <div className="form-grid">
          <label className="field"><span>Price *</span>
            <input className="input" type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={set("price")} />
          </label>
          <label className="field"><span>Old price (optional)</span>
            <input className="input" type="number" inputMode="decimal" min="0" step="0.01" value={form.compare_at_price} onChange={set("compare_at_price")} />
          </label>
          <label className="field"><span>Stock</span>
            <input className="input" type="number" inputMode="numeric" min="0" step="1" value={form.stock} onChange={set("stock")} />
          </label>
          <label className="field"><span>Low-stock alert at</span>
            <input className="input" type="number" inputMode="numeric" min="0" step="1" value={form.low_stock_alert} onChange={set("low_stock_alert")} />
          </label>
        </div>
        <label className="field"><span>SKU (optional)</span>
          <input className="input" value={form.sku} onChange={set("sku")} maxLength={60} />
        </label>
      </div>

      <div className="card">
        <ImageUpload label="Main photo" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
        <div className="field">
          <span>More photos</span>
          <div className="extra-grid">
            {form.extra_images.map((url) => (
              <div className="extra-item" key={url}>
                <img src={url} alt="" />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeExtra(url)}>Remove</button>
              </div>
            ))}
          </div>
          <ImageUpload label="" value="" onChange={addExtra} />
        </div>
      </div>

      <div className="card">
        <label className="check"><input type="checkbox" checked={form.is_active} onChange={setCheck("is_active")} /> Visible in the store</label>
        <label className="check"><input type="checkbox" checked={form.is_featured} onChange={setCheck("is_featured")} /> Featured on the home page</label>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

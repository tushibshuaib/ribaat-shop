import { useCallback, useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { makeSlug, slugify } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";
import ImageUpload from "./ImageUpload.jsx";

const EMPTY = { id: null, name: "", slug: "", image_url: "", sort_order: "0", is_active: true };

export default function Categories() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("categories").select("*").order("sort_order", { ascending: true });
    if (err) setError(err.message);
    else setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function edit(c) {
    setError("");
    setForm({
      id: c.id, name: c.name, slug: c.slug, image_url: c.image_url || "",
      sort_order: String(c.sort_order), is_active: c.is_active,
    });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const order = Number(form.sort_order);
    if (name.length < 2) return setError("Enter a category name.");
    if (!Number.isInteger(order)) return setError("Order must be a whole number.");
    const payload = {
      name,
      slug: slugify(form.slug) || makeSlug(name),
      image_url: form.image_url || null,
      sort_order: order,
      is_active: form.is_active,
    };
    setBusy(true);
    const query = form.id
      ? supabase.from("categories").update(payload).eq("id", form.id)
      : supabase.from("categories").insert(payload);
    const { error: err } = await query;
    setBusy(false);
    if (err) {
      return setError(err.code === "23505" ? "That URL slug is already used. Change it." : err.message);
    }
    setForm(null);
    load();
  }

  async function remove(c) {
    if (!window.confirm(`Delete "${c.name}"? Its products will become uncategorized.`)) return;
    setError("");
    const { error: err } = await supabase.from("categories").delete().eq("id", c.id);
    if (err) return setError(err.message);
    load();
  }

  if (!items && !error) return <Loader />;

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>Categories</h1>
        {!form ? (
          <button type="button" className="btn btn-primary" onClick={() => { setError(""); setForm(EMPTY); }}>
            + Add category
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {form ? (
        <form className="card" onSubmit={save}>
          <h3>{form.id ? "Edit category" : "New category"}</h3>
          <label className="field"><span>Name *</span>
            <input className="input" value={form.name} onChange={set("name")} maxLength={80} />
          </label>
          <label className="field"><span>URL slug (leave empty to create automatically)</span>
            <input className="input" value={form.slug} onChange={set("slug")} maxLength={80} />
          </label>
          <label className="field"><span>Display order (smaller shows first)</span>
            <input className="input" type="number" inputMode="numeric" step="1" value={form.sort_order} onChange={set("sort_order")} />
          </label>
          <ImageUpload label="Image (optional)" folder="categories" value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
          <label className="check">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Visible in the store
          </label>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {items && items.length === 0 ? <p className="muted">No categories yet.</p> : null}
      <div className="a-list">
        {(items || []).map((c) => (
          <div className="a-item" key={c.id}>
            {c.image_url ? <img className="a-thumb" src={c.image_url} alt="" /> : <div className="a-thumb p-placeholder">{c.name.charAt(0)}</div>}
            <div className="a-info">
              <strong>{c.name}</strong>
              <span className="muted">/{c.slug} · order {c.sort_order}</span>
              <span className={c.is_active ? "badge badge-green" : "badge"}>{c.is_active ? "Visible" : "Hidden"}</span>
            </div>
            <div className="a-actions">
              <button type="button" className="btn btn-sm" onClick={() => edit(c)}>Edit</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

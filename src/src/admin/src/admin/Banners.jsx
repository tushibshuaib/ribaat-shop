import { useCallback, useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { supabase } from "../lib/supabase.js";
import ImageUpload from "./ImageUpload.jsx";

const EMPTY = { id: null, title: "", subtitle: "", image_url: "", link_url: "", sort_order: "0", is_active: true };

function validLink(v) {
  if (!v) return true;
  return (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v);
}

export default function Banners() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("banners").select("*").order("sort_order", { ascending: true });
    if (err) setError(err.message);
    else setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function edit(b) {
    setError("");
    setForm({
      id: b.id, title: b.title || "", subtitle: b.subtitle || "", image_url: b.image_url,
      link_url: b.link_url || "", sort_order: String(b.sort_order), is_active: b.is_active,
    });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const order = Number(form.sort_order);
    const link = form.link_url.trim();
    if (!form.image_url) return setError("Please upload a banner image.");
    if (!Number.isInteger(order)) return setError("Order must be a whole number.");
    if (!validLink(link)) return setError("Link must start with / (inside the store) or https://");
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image_url: form.image_url,
      link_url: link,
      sort_order: order,
      is_active: form.is_active,
    };
    setBusy(true);
    const query = form.id
      ? supabase.from("banners").update(payload).eq("id", form.id)
      : supabase.from("banners").insert(payload);
    const { error: err } = await query;
    setBusy(false);
    if (err) return setError(err.message);
    setForm(null);
    load();
  }

  async function remove(b) {
    if (!window.confirm("Delete this banner?")) return;
    setError("");
    const { error: err } = await supabase.from("banners").delete().eq("id", b.id);
    if (err) return setError(err.message);
    load();
  }

  if (!items && !error) return <Loader />;

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>Banners</h1>
        {!form ? (
          <button type="button" className="btn btn-primary" onClick={() => { setError(""); setForm(EMPTY); }}>
            + Add banner
          </button>
        ) : null}
      </div>
      <p className="muted">Tip: use wide photos, around 1600 × 800.</p>
      {error ? <p className="error-text">{error}</p> : null}

      {form ? (
        <form className="card" onSubmit={save}>
          <h3>{form.id ? "Edit banner" : "New banner"}</h3>
          <ImageUpload label="Banner image *" folder="banners" value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
          <label className="field"><span>Title (optional)</span>
            <input className="input" value={form.title} onChange={set("title")} maxLength={100} />
          </label>
          <label className="field"><span>Subtitle (optional)</span>
            <input className="input" value={form.subtitle} onChange={set("subtitle")} maxLength={160} />
          </label>
          <label className="field"><span>Link (optional, e.g. /shop or https://…)</span>
            <input className="input" value={form.link_url} onChange={set("link_url")} maxLength={300} />
          </label>
          <label className="field"><span>Display order (smaller shows first)</span>
            <input className="input" type="number" inputMode="numeric" step="1" value={form.sort_order} onChange={set("sort_order")} />
          </label>
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

      {items && items.length === 0 ? <p className="muted">No banners yet.</p> : null}
      <div className="a-list">
        {(items || []).map((b) => (
          <div className="a-item" key={b.id}>
            <img className="a-thumb a-thumb-wide" src={b.image_url} alt="" />
            <div className="a-info">
              <strong>{b.title || "(no title)"}</strong>
              <span className="muted">order {b.sort_order}{b.link_url ? ` · ${b.link_url}` : ""}</span>
              <span className={b.is_active ? "badge badge-green" : "badge"}>{b.is_active ? "Visible" : "Hidden"}</span>
            </div>
            <div className="a-actions">
              <button type="button" className="btn btn-sm" onClick={() => edit(b)}>Edit</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(b)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

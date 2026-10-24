import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { money } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";

export default function Products() {
  const { settings } = useSettings();
  const sym = settings.currency_symbol;
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(p) {
    setError("");
    const { error: err } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (err) return setError(err.message);
    setItems((list) => list.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setError("");
    const { error: err } = await supabase.from("products").delete().eq("id", p.id);
    if (err) return setError(err.message);
    setItems((list) => list.filter((x) => x.id !== p.id));
  }

  if (!items && !error) return <Loader />;
  const term = q.trim().toLowerCase();
  const shown = (items || []).filter((p) => !term || p.name.toLowerCase().includes(term));

  return (
    <div className="stack">
      <div className="admin-head">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>
      <input className="input" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      {error ? <p className="error-text">{error}</p> : null}
      {items && shown.length === 0 ? <p className="muted">No products found.</p> : null}

      <div className="a-list">
        {shown.map((p) => (
          <div className="a-item" key={p.id}>
            {p.image_url ? <img className="a-thumb" src={p.image_url} alt="" /> : <div className="a-thumb p-placeholder">{p.name.charAt(0)}</div>}
            <div className="a-info">
              <strong>{p.name}</strong>
              <span className="muted">{p.category ? p.category.name : "No category"} · {money(p.price, sym)}</span>
              <span>
                <span className={p.stock < 1 ? "badge badge-danger" : p.stock <= p.low_stock_alert ? "badge badge-warn" : "badge badge-green"}>
                  Stock {p.stock}
                </span>{" "}
                <span className={p.is_active ? "badge badge-green" : "badge"}>{p.is_active ? "Visible" : "Hidden"}</span>
                {p.is_featured ? <> <span className="badge badge-warn">Featured</span></> : null}
              </span>
            </div>
            <div className="a-actions">
              <Link to={`/admin/products/${p.id}`} className="btn btn-sm">Edit</Link>
              <button type="button" className="btn btn-sm" onClick={() => toggle(p)}>{p.is_active ? "Hide" : "Show"}</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { supabase } from "../lib/supabase.js";

export default function Inventory() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [amounts, setAmounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("products")
      .select("id, name, stock, low_stock_alert, image_url, is_active")
      .order("name", { ascending: true });
    if (err) setError(err.message);
    else setItems(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function adjust(p, delta) {
    if (!Number.isInteger(delta) || delta === 0) return;
    setError("");
    setBusyId(p.id);
    const { data, error: err } = await supabase.rpc("admin_adjust_stock", {
      p_product: p.id,
      p_delta: delta,
    });
    setBusyId("");
    if (err) return setError(err.message);
    setItems((list) => list.map((x) => (x.id === p.id ? { ...x, stock: data } : x)));
  }

  function applyCustom(p) {
    const delta = Number(amounts[p.id]);
    if (!Number.isInteger(delta) || delta === 0) return setError("Enter a whole number like 10 or -3.");
    setAmounts((a) => ({ ...a, [p.id]: "" }));
    adjust(p, delta);
  }

  if (!items && !error) return <Loader />;

  const term = q.trim().toLowerCase();
  const shown = (items || []).filter((p) => {
    if (term && !p.name.toLowerCase().includes(term)) return false;
    if (filter === "out") return p.stock < 1;
    if (filter === "low") return p.stock > 0 && p.stock <= p.low_stock_alert;
    return true;
  });

  return (
    <div className="stack">
      <h1>Inventory</h1>
      <input className="input" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        {[["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]].map(([key, label]) => (
          <button key={key} type="button" className={filter === key ? "chip active" : "chip"} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {items && shown.length === 0 ? <p className="muted">Nothing to show.</p> : null}

      <div className="a-list">
        {shown.map((p) => (
          <div className="a-item inv-item" key={p.id}>
            <div className="a-info">
              <strong>{p.name}</strong>
              <span>
                <span className={p.stock < 1 ? "badge badge-danger" : p.stock <= p.low_stock_alert ? "badge badge-warn" : "badge badge-green"}>
                  {p.stock} in stock
                </span>{" "}
                {!p.is_active ? <span className="badge">Hidden</span> : null}
              </span>
            </div>
            <div className="inv-controls">
              <button type="button" className="btn btn-sm" disabled={busyId === p.id || p.stock < 1} onClick={() => adjust(p, -1)}>−1</button>
              <button type="button" className="btn btn-sm" disabled={busyId === p.id} onClick={() => adjust(p, 1)}>+1</button>
              <input
                className="input inv-input" type="number" inputMode="numeric" step="1"
                placeholder="±" value={amounts[p.id] || ""}
                onChange={(e) => setAmounts((a) => ({ ...a, [p.id]: e.target.value }))}
              />
              <button type="button" className="btn btn-primary btn-sm" disabled={busyId === p.id} onClick={() => applyCustom(p)}>Apply</button>
            </div>
          </div>
        ))}
      </div>
      <p className="muted">Use a plus number to add stock (10) and a minus number to remove it (-3).</p>
    </div>
  );
}

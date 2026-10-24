import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { formatDate, money, statusBadgeClass } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";

export default function Dashboard() {
  const { settings } = useSettings();
  const sym = settings.currency_symbol;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    Promise.all([
      supabase.from("products").select("id, name, stock, low_stock_alert"),
      supabase.from("orders")
        .select("id, order_number, customer_name, total, status, created_at")
        .gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ])
      .then(([p, o, pend]) => {
        const failed = p.error || o.error || pend.error;
        if (failed) throw new Error(failed.message);
        const live = o.data.filter((x) => x.status !== "cancelled");
        if (!alive) return;
        setData({
          products: p.data.length,
          out: p.data.filter((x) => x.stock < 1).length,
          low: p.data.filter((x) => x.stock > 0 && x.stock <= x.low_stock_alert),
          pending: pend.count || 0,
          orders30: live.length,
          revenue30: live.reduce((n, x) => n + Number(x.total), 0),
          recent: o.data.slice(0, 5),
        });
      })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <Loader />;

  return (
    <div className="stack">
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat"><span>Pending orders</span><b>{data.pending}</b></div>
        <div className="stat"><span>Sales (30 days)</span><b>{money(data.revenue30, sym)}</b></div>
        <div className="stat"><span>Orders (30 days)</span><b>{data.orders30}</b></div>
        <div className="stat"><span>Products</span><b>{data.products}</b></div>
        <div className="stat"><span>Out of stock</span><b>{data.out}</b></div>
        <div className="stat"><span>Low stock</span><b>{data.low.length}</b></div>
      </div>

      {data.low.length > 0 ? (
        <div className="card">
          <h3>Running low</h3>
          {data.low.slice(0, 8).map((p) => (
            <div className="sum-line" key={p.id}>
              <span>{p.name}</span><span className="badge badge-warn">{p.stock} left</span>
            </div>
          ))}
          <Link to="/admin/inventory">Manage inventory →</Link>
        </div>
      ) : null}

      <div className="card">
        <h3>Recent orders</h3>
        {data.recent.length === 0 ? <p className="muted">No orders yet.</p> : null}
        {data.recent.map((o) => (
          <div className="sum-line" key={o.id}>
            <span>{o.order_number} · {o.customer_name}<br /><small className="muted">{formatDate(o.created_at)}</small></span>
            <span>{money(o.total, sym)}<br /><span className={statusBadgeClass(o.status)}>{o.status}</span></span>
          </div>
        ))}
        <Link to="/admin/orders">All orders →</Link>
      </div>
    </div>
  );
}

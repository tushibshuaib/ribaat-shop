import { useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { formatDate, money, ORDER_STATUSES, statusBadgeClass } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";

const PAY = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad" };

export default function Orders() {
  const { settings } = useSettings();
  const sym = settings.currency_symbol;
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState("");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setOrders(null);
    setError("");
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") query = query.eq("status", filter);
    query.then(({ data, error: err }) => {
      if (!alive) return;
      if (err) setError(err.message);
      else setOrders(data);
    });
    return () => { alive = false; };
  }, [filter]);

  async function changeStatus(order, status) {
    if (status === order.status) return;
    if (status === "cancelled" && !window.confirm("Cancel this order? The stock will be returned.")) return;
    setError("");
    setBusyId(order.id);
    const { error: err } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setBusyId("");
    if (err) return setError(err.message);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status } : o)));
  }

  if (!orders && !error) return <Loader />;

  const term = q.trim().toLowerCase();
  const shown = (orders || []).filter(
    (o) =>
      !term ||
      o.order_number.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.phone.includes(term)
  );

  return (
    <div className="stack">
      <h1>Orders</h1>
      <input className="input" type="search" placeholder="Search order no., name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button key={s} type="button" className={filter === s ? "chip active" : "chip"} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {orders && shown.length === 0 ? <p className="muted">No orders found.</p> : null}

      <div className="a-list">
        {shown.map((o) => (
          <div className="card order-card" key={o.id}>
            <button type="button" className="order-head" onClick={() => setOpen(open === o.id ? "" : o.id)}>
              <span>
                <strong>{o.order_number}</strong> · {o.customer_name}
                <br /><small className="muted">{formatDate(o.created_at)}</small>
              </span>
              <span style={{ textAlign: "right" }}>
                <strong>{money(o.total, sym)}</strong>
                <br /><span className={statusBadgeClass(o.status)}>{o.status}</span>
              </span>
            </button>

            {open === o.id ? (
              <div className="order-body stack">
                <div>
                  <a href={`tel:${o.phone}`}>{o.phone}</a>
                  {o.email ? <> · <a href={`mailto:${o.email}`}>{o.email}</a></> : null}
                </div>
                <div>{o.address}</div>
                <div className="muted">Area: {o.delivery_zone === "inside" ? "Inside city" : "Outside city"}</div>
                {o.notes ? <div className="notice">Note: {o.notes}</div> : null}
                <div>
                  Payment: <strong>{PAY[o.payment_method] || o.payment_method}</strong>
                  {o.payment_trx_id ? <> · TrxID <strong>{o.payment_trx_id}</strong></> : null}
                </div>

                <div>
                  {(o.order_items || []).map((it) => (
                    <div className="sum-line" key={it.id}>
                      <span>{it.product_name} × {it.quantity}</span>
                      <span>{money(it.line_total, sym)}</span>
                    </div>
                  ))}
                  <div className="sum-line"><span>Delivery</span><span>{money(o.delivery_fee, sym)}</span></div>
                  <div className="sum-line sum-total"><span>Total</span><span>{money(o.total, sym)}</span></div>
                </div>

                <label className="field"><span>Order status</span>
                  <select className="input" value={o.status} disabled={busyId === o.id}
                    onChange={(e) => changeStatus(o, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {orders && orders.length === 100 ? <p className="muted">Showing the latest 100 orders.</p> : null}
    </div>
  );
}

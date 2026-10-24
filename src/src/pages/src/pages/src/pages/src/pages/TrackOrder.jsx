import { useState } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { trackOrder } from "../lib/api.js";
import { formatDate, money, statusBadgeClass } from "../lib/format.js";

export default function TrackOrder() {
  const { settings } = useSettings();
  const sym = settings.currency_symbol;
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setBusy(true);
    try {
      const res = await trackOrder(number.trim(), phone.trim());
      setOrder(res.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1>Track your order</h1>
      <form className="card" onSubmit={submit}>
        <label className="field"><span>Order number (e.g. RB-1001)</span>
          <input className="input" value={number} onChange={(e) => setNumber(e.target.value)} />
        </label>
        <label className="field"><span>Phone used for the order</span>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Searching…" : "Track"}
        </button>
      </form>

      {order ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row spread">
            <h3 style={{ margin: 0 }}>{order.order_number}</h3>
            <span className={statusBadgeClass(order.status)}>{order.status}</span>
          </div>
          <p className="muted">Placed {formatDate(order.created_at)}</p>
          {(order.order_items || []).map((it, n) => (
            <div className="sum-line" key={n}>
              <span>{it.product_name} × {it.quantity}</span>
              <span>{money(it.line_total, sym)}</span>
            </div>
          ))}
          <div className="sum-line"><span>Delivery</span><span>{money(order.delivery_fee, sym)}</span></div>
          <div className="sum-line sum-total"><span>Total</span><span>{money(order.total, sym)}</span></div>
        </div>
      ) : null}
    </div>
  );
}

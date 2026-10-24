import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { placeOrder } from "../lib/api.js";
import { isValidPhone, money } from "../lib/format.js";

const EMPTY = {
  name: "", phone: "", email: "", address: "",
  zone: "inside", notes: "", payment: "", trx: "",
};
const LABELS = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad" };

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { settings: s } = useSettings();
  const sym = s.currency_symbol;

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const methods = [];
  if (s.cod_enabled) methods.push("cod");
  if (s.manual_pay_enabled && s.bkash_number) methods.push("bkash");
  if (s.manual_pay_enabled && s.nagad_number) methods.push("nagad");
  const method = methods.includes(form.payment) ? form.payment : methods[0];

  const baseFee = Number(form.zone === "inside" ? s.delivery_fee_inside : s.delivery_fee_outside);
  const freeAt = Number(s.free_delivery_over);
  const fee = freeAt > 0 && subtotal >= freeAt ? 0 : baseFee;
  const total = subtotal + fee;

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn btn-primary">Back to shop</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!method) return setError("No payment method is available right now.");
    if (form.name.trim().length < 2) return setError("Please enter your name.");
    if (!isValidPhone(form.phone)) return setError("Please enter a valid phone number.");
    if (form.address.trim().length < 5) return setError("Please enter your full address.");
    if (method !== "cod" && form.trx.trim().length < 4) {
      return setError("Please enter the payment transaction ID.");
    }
    setBusy(true);
    try {
      const res = await placeOrder({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        zone: form.zone,
        notes: form.notes,
        payment_method: method,
        trx_id: method === "cod" ? "" : form.trx,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      clear();
      navigate("/order-success", {
        replace: true,
        state: { orderNumber: res.order_number, total: res.total },
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const payNumber = method === "bkash" ? s.bkash_number : method === "nagad" ? s.nagad_number : "";

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <form className="checkout-grid" onSubmit={submit}>
        <div className="card">
          <h3>Delivery details</h3>
          <label className="field"><span>Full name *</span>
            <input className="input" value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
          </label>
          <label className="field"><span>Phone *</span>
            <input className="input" type="tel" value={form.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" />
          </label>
          <label className="field"><span>Email (optional)</span>
            <input className="input" type="email" value={form.email} onChange={set("email")} maxLength={120} autoComplete="email" />
          </label>
          <label className="field"><span>Full address *</span>
            <textarea className="input" value={form.address} onChange={set("address")} maxLength={300} />
          </label>
          <label className="field"><span>Delivery area</span>
            <select className="input" value={form.zone} onChange={set("zone")}>
              <option value="inside">Inside city ({money(s.delivery_fee_inside, sym)})</option>
              <option value="outside">Outside city ({money(s.delivery_fee_outside, sym)})</option>
            </select>
          </label>
          <label className="field"><span>Order note (optional)</span>
            <textarea className="input" value={form.notes} onChange={set("notes")} maxLength={500} />
          </label>
        </div>

        <div className="card">
          <h3>Payment</h3>
          {methods.length === 0 ? <p className="error-text">No payment method is available right now.</p> : null}
          {methods.map((m) => (
            <label key={m} className={m === method ? "radio-card on" : "radio-card"}>
              <input type="radio" name="pay" checked={m === method} onChange={() => setForm((f) => ({ ...f, payment: m }))} />
              <span>{LABELS[m]}</span>
            </label>
          ))}
          {method && method !== "cod" ? (
            <div className="notice">
              <p>Send <strong>{money(total, sym)}</strong> to <strong>{payNumber}</strong> ({LABELS[method]}).</p>
              {s.payment_instructions ? <p className="muted">{s.payment_instructions}</p> : null}
              <label className="field"><span>Transaction ID *</span>
                <input className="input" value={form.trx} onChange={set("trx")} maxLength={40} />
              </label>
            </div>
          ) : null}

          <h3>Summary</h3>
          {items.map((i) => (
            <div className="sum-line" key={i.id}>
              <span>{i.name} × {i.quantity}</span>
              <span>{money(i.price * i.quantity, sym)}</span>
            </div>
          ))}
          <div className="sum-line"><span>Subtotal</span><span>{money(subtotal, sym)}</span></div>
          <div className="sum-line"><span>Delivery</span><span>{fee === 0 ? "Free" : money(fee, sym)}</span></div>
          <div className="sum-line sum-total"><span>Total</span><span>{money(total, sym)}</span></div>
          <p className="muted">The store re-checks prices and stock when you place the order.</p>

          {error ? <p className="error-text">{error}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !method}>
            {busy ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
import { money } from "../lib/format.js";

export default function OrderSuccess() {
  const { state } = useLocation();
  const { settings } = useSettings();

  return (
    <div className="container page" style={{ textAlign: "center" }}>
      <div className="big-ok">✅</div>
      <h1>Thank you for your order!</h1>
      {state && state.orderNumber ? (
        <div className="card" style={{ maxWidth: 420, margin: "0 auto 16px" }}>
          <p className="muted">Your order number</p>
          <h2>{state.orderNumber}</h2>
          <p>Total: <strong>{money(state.total, settings.currency_symbol)}</strong></p>
          <p className="muted">Save this number. With your phone number it lets you track the order.</p>
        </div>
      ) : (
        <p className="muted">Your order has been received.</p>
      )}
      <div className="row" style={{ justifyContent: "center" }}>
        <Link to="/track" className="btn">Track order</Link>
        <Link to="/shop" className="btn btn-primary">Continue shopping</Link>
      </div>
    </div>
  );
}

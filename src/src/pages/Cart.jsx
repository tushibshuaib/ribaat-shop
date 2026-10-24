import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { money } from "../lib/format.js";

export default function Cart() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const { settings } = useSettings();
  const sym = settings.currency_symbol;

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn btn-primary">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Your cart</h1>
      <div className="card">
        {items.map((i) => (
          <div className="cart-row" key={i.id}>
            {i.image_url ? (
              <img src={i.image_url} alt={i.name} />
            ) : (
              <div className="cart-thumb p-placeholder" style={{ fontSize: "1.5rem" }}>
                {i.name.charAt(0)}
              </div>
            )}
            <div>
              <Link to={`/product/${i.slug}`} className="p-name">{i.name}</Link>
              <div className="muted">{money(i.price, sym)} each</div>
            </div>
            <div className="cart-actions">
              <div className="qty">
                <button type="button" aria-label="Less" onClick={() => setQty(i.id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button type="button" aria-label="More" onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
              </div>
              <strong>{money(i.price * i.quantity, sym)}</strong>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(i.id)}>Remove</button>
            </div>
          </div>
        ))}
        <div className="sum-line sum-total">
          <span>Subtotal</span>
          <span>{money(subtotal, sym)}</span>
        </div>
        <p className="muted">Delivery fee is added at checkout. Final prices are confirmed by the store.</p>
        <div className="row spread">
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Clear cart</button>
          <Link to="/checkout" className="btn btn-primary">Checkout</Link>
        </div>
      </div>
    </div>
  );
}

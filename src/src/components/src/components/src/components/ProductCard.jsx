import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { discountPercent, money } from "../lib/format.js";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { settings } = useSettings();
  const sym = settings.currency_symbol;
  const off = discountPercent(product.price, product.compare_at_price);
  const out = product.stock < 1;
  const href = `/product/${product.slug}`;

  return (
    <article className="p-card">
      <Link to={href} className="p-media">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="p-placeholder">{product.name.charAt(0)}</div>
        )}
        {out ? <span className="p-tag p-tag-out">Sold out</span> : null}
        {!out && off > 0 ? <span className="p-tag">-{off}%</span> : null}
      </Link>
      <div className="p-body">
        <Link to={href} className="p-name">{product.name}</Link>
        <div className="p-prices">
          <strong>{money(product.price, sym)}</strong>
          {off > 0 ? <s className="muted">{money(product.compare_at_price, sym)}</s> : null}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-sm"
          disabled={out}
          onClick={() => add(product, 1)}
        >
          {out ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

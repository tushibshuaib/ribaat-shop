import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { getProductBySlug, getRelatedProducts } from "../lib/api.js";
import { discountPercent, money } from "../lib/format.js";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { settings } = useSettings();
  const sym = settings.currency_symbol;

  const [product, setProduct] = useState(undefined); // undefined = loading, null = not found
  const [related, setRelated] = useState([]);
  const [active, setActive] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    setProduct(undefined);
    setRelated([]);
    setQty(1);
    getProductBySlug(slug)
      .then((p) => {
        if (!alive) return;
        setProduct(p || null);
        if (p) {
          setActive(p.image_url || (p.extra_images || [])[0] || "");
          getRelatedProducts(p.category_id, p.id).then((r) => { if (alive) setRelated(r); }).catch(() => {});
        }
      })
      .catch(() => { if (alive) setProduct(null); });
    window.scrollTo(0, 0);
    return () => { alive = false; };
  }, [slug]);

  if (product === undefined) return <Loader />;
  if (product === null) {
    return (
      <div className="container page">
        <h1>Product not found</h1>
        <Link to="/shop" className="btn btn-primary">Back to shop</Link>
      </div>
    );
  }

  const images = [product.image_url, ...(product.extra_images || [])].filter(Boolean);
  const out = product.stock < 1;
  const low = !out && product.stock <= product.low_stock_alert;
  const off = discountPercent(product.price, product.compare_at_price);

  function addToCart() { add(product, qty); }
  function buyNow() { add(product, qty); navigate("/cart"); }

  return (
    <div className="container page">
      <p className="muted">
        <Link to="/shop">Shop</Link>
        {product.category ? <> / <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link></> : null}
      </p>

      <div className="detail">
        <div>
          <div className="detail-main">
            {active ? <img src={active} alt={product.name} /> : <div className="p-placeholder">{product.name.charAt(0)}</div>}
          </div>
          {images.length > 1 ? (
            <div className="thumbs">
              {images.map((src) => (
                <button key={src} type="button" className={src === active ? "thumb on" : "thumb"} onClick={() => setActive(src)}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="stack">
          <h1>{product.name}</h1>
          <div className="row">
            <span className="detail-price">{money(product.price, sym)}</span>
            {off > 0 ? <s className="muted">{money(product.compare_at_price, sym)}</s> : null}
            {off > 0 ? <span className="badge badge-green">{off}% off</span> : null}
          </div>

          {out ? <span className="badge badge-danger">Out of stock</span> : null}
          {low ? <span className="badge badge-warn">Only {product.stock} left</span> : null}
          {!out && !low ? <span className="badge badge-green">In stock</span> : null}

          {!out ? (
            <div className="row">
              <div className="qty">
                <button type="button" aria-label="Less" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" aria-label="More" onClick={() => setQty((n) => Math.min(product.stock, n + 1))}>+</button>
              </div>
            </div>
          ) : null}

          <div className="row">
            <button type="button" className="btn btn-primary" disabled={out} onClick={addToCart}>Add to cart</button>
            <button type="button" className="btn" disabled={out} onClick={buyNow}>Buy now</button>
          </div>

          {product.description ? <p className="desc">{product.description}</p> : null}
          {product.sku ? <p className="muted">SKU: {product.sku}</p> : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="section">
          <div className="section-head"><h2>You may also like</h2></div>
          <div className="grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

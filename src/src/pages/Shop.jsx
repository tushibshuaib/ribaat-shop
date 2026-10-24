import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getCategories, getProducts } from "../lib/api.js";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const slug = params.get("category") || "";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "newest";

  const [categories, setCategories] = useState([]);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setCatsLoaded(true));
  }, []);

  const category = categories.find((c) => c.slug === slug);
  const categoryId = category ? category.id : null;

  useEffect(() => {
    if (slug && !catsLoaded) return undefined;
    let alive = true;
    setProducts(null);
    setError("");
    if (slug && !categoryId) {
      setProducts([]);
      return undefined;
    }
    getProducts({ categoryId, search: q, sort })
      .then((list) => { if (alive) setProducts(list); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [slug, q, sort, categoryId, catsLoaded]);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="container page">
      <h1>{category ? category.name : "All products"}</h1>

      <div className="chips">
        <button type="button" className={!slug ? "chip active" : "chip"} onClick={() => update("category", "")}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={slug === c.slug ? "chip active" : "chip"}
            onClick={() => update("category", c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span className="muted">
          {q ? <>Results for “{q}” </> : null}
          {q ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => update("q", "")}>Clear</button> : null}
        </span>
        <select className="input" value={sort} onChange={(e) => update("sort", e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {!error && products === null ? <Loader /> : null}
      {products && products.length === 0 ? <p className="muted">No products found.</p> : null}
      {products && products.length > 0 ? (
        <div className="grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : null}
    </div>
  );
}

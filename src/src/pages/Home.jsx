import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BannerSlider from "../components/BannerSlider.jsx";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { getBanners, getCategories, getProducts } from "../lib/api.js";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      getBanners(),
      getCategories(),
      getProducts({ featured: true, limit: 8 }),
      getProducts({ limit: 8 }),
    ])
      .then(([banners, categories, featured, latest]) => {
        if (alive) setData({ banners, categories, featured, latest });
      })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  if (error) return <div className="container page error-text">Could not load the store: {error}</div>;
  if (!data) return <Loader />;

  return (
    <div className="container page">
      <BannerSlider banners={data.banners} />

      {data.categories.length > 0 ? (
        <section className="section">
          <div className="section-head"><h2>Categories</h2></div>
          <div className="chips">
            {data.categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="chip">{c.name}</Link>
            ))}
          </div>
        </section>
      ) : null}

      {data.featured.length > 0 ? (
        <section className="section">
          <div className="section-head"><h2>Featured</h2></div>
          <div className="grid">
            {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <h2>New arrivals</h2>
          <Link to="/shop">View all</Link>
        </div>
        {data.latest.length === 0 ? (
          <p className="muted">No products yet. Check back soon.</p>
        ) : (
          <div className="grid">
            {data.latest.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

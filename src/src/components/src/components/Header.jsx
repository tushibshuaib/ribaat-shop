import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function Header() {
  const { settings } = useSettings();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSearch(e) {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  return (
    <>
      {settings.announcement ? <div className="announce">{settings.announcement}</div> : null}
      <header className="site-header">
        <div className="container">
          <div className="header-top">
            <Link to="/" className="brand">{settings.store_name}</Link>
            <nav className="nav">
              <NavLink to="/shop">Shop</NavLink>
              <NavLink to="/track">Track</NavLink>
              <Link to="/cart" className="cart-link" aria-label="Cart">
                🛒
                {count > 0 ? <span className="cart-count">{count}</span> : null}
              </Link>
            </nav>
          </div>
          <form className="search-form" onSubmit={onSearch}>
            <input
              className="input"
              type="search"
              placeholder="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
        </div>
      </header>
    </>
  );
}

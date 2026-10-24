import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const LINKS = [
  ["/admin", "Dashboard", true],
  ["/admin/products", "Products", false],
  ["/admin/categories", "Categories", false],
  ["/admin/banners", "Banners", false],
  ["/admin/inventory", "Inventory", false],
  ["/admin/orders", "Orders", false],
  ["/admin/settings", "Settings", false],
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-bar">
          <strong className="admin-brand">{settings.store_name} Admin</strong>
          <div className="row">
            <Link to="/" className="btn btn-ghost btn-sm">View store</Link>
            <button type="button" className="btn btn-sm" onClick={signOut}>Sign out</button>
          </div>
        </div>
        <nav className="admin-nav">
          {LINKS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

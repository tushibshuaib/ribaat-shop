import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";

export default function Footer() {
  const { settings: s } = useSettings();
  const wa = String(s.whatsapp || "").replace(/[^0-9]/g, "");
  const fb = /^https:\/\//i.test(s.facebook_url || "") ? s.facebook_url : "";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>{s.store_name}</h3>
            <p className="muted">{s.tagline}</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop">All products</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/track">Track order</Link>
          </div>
          <div>
            <h4>Contact</h4>
            {s.contact_phone ? <a href={`tel:${s.contact_phone}`}>{s.contact_phone}</a> : null}
            {s.contact_email ? <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : null}
            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}
            {fb ? <a href={fb} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
            {s.address ? <span className="muted">{s.address}</span> : null}
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} {s.store_name}. All rights reserved.</p>
      </div>
    </footer>
  );
}

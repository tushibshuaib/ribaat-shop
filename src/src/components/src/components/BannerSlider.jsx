import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function SlideLink({ href, children }) {
  if (href && href.startsWith("/") && !href.startsWith("//")) {
    return <Link to={href} className="slide-link">{children}</Link>;
  }
  if (href && /^https?:\/\//i.test(href)) {
    return (
      <a href={href} className="slide-link" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <div className="slide-link">{children}</div>;
}

export default function BannerSlider({ banners }) {
  const [i, setI] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) return null;
  const idx = i % total;

  return (
    <div className="slider">
      {banners.map((b, n) => (
        <div key={b.id} className={n === idx ? "slide on" : "slide"}>
          <SlideLink href={b.link_url}>
            <img src={b.image_url} alt={b.title || "Banner"} loading={n === 0 ? "eager" : "lazy"} />
            {b.title || b.subtitle ? (
              <div className="slide-caption">
                {b.title ? <h3>{b.title}</h3> : null}
                {b.subtitle ? <p>{b.subtitle}</p> : null}
              </div>
            ) : null}
          </SlideLink>
        </div>
      ))}
      {total > 1 ? (
        <div className="dots">
          {banners.map((b, n) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${n + 1}`}
              className={n === idx ? "dot on" : "dot"}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

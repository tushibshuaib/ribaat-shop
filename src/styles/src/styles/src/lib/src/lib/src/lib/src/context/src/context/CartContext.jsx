import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "ribaat_cart_v1";

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.id && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const max = Math.max(0, Number(product.stock) || 0);
      if (max < 1) return prev;
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, stock: max, price: Number(product.price), quantity: Math.min(max, i.quantity + qty) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url || "",
          stock: max,
          quantity: Math.min(max, qty),
        },
      ];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.min(i.stock, Math.floor(qty)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return { items, count, subtotal, add, setQty, remove, clear };
  }, [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

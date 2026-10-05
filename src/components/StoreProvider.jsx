import { useCallback, useEffect, useMemo, useState } from "react";
import { products } from "../data/products";
import { StoreContext } from "../hooks/useStore";

function readSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readCart() {
  const normalized = readSaved("royal-jewel-cart-v1", []).flatMap((item) => {
    if (!item || typeof item.productId !== "string") return [];
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) return [];
    const size = product.sizes.includes(item.size) ? item.size : product.sizes[0] || "One size";
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) return [];
    return [{ key: product.id + "::" + size, productId: product.id, size, quantity }];
  });
  return normalized.reduce((items, item) => {
    const existing = items.find((entry) => entry.key === item.key);
    if (existing) existing.quantity += item.quantity;
    else items.push(item);
    return items;
  }, []);
}

function readWishlist() {
  return [...new Set(readSaved("royal-jewel-wishlist-v1", []).filter((id) =>
    typeof id === "string" && products.some((product) => product.id === id),
  ))];
}

export default function StoreProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [wishlist, setWishlist] = useState(readWishlist);

  useEffect(() => {
    try {
      localStorage.setItem("royal-jewel-cart-v1", JSON.stringify(cart));
      localStorage.setItem("royal-jewel-wishlist-v1", JSON.stringify(wishlist));
    } catch {
      // The store still works for the current page if browser storage is unavailable.
    }
  }, [cart, wishlist]);

  const addToCart = useCallback((product, size) => {
    const chosenSize = size || product.sizes?.[0] || "One size";
    const key = product.id + "::" + chosenSize;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return current.concat({ key, productId: product.id, size: chosenSize, quantity: 1 });
    });
    return key;
  }, []);

  const updateQuantity = useCallback((key, amount) => {
    setCart((current) => current
      .map((item) => item.key === key ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item)
      .filter((item) => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart((current) => current.filter((item) => item.key !== key));
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((current) => {
      const saved = !current.includes(productId);
      return saved ? current.concat(productId) : current.filter((id) => id !== productId);
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist((current) => current.filter((id) => id !== productId));
  }, []);

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0), [cart]);

  return (
    <StoreContext.Provider value={{
      cart,
      wishlist,
      cartCount,
      cartSubtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      toggleWishlist,
      removeFromWishlist,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

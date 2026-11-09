import { useCallback, useEffect, useMemo, useState } from "react";
import { products as sampleProducts } from "../data/products";
import { api } from "../api/client";
import { StoreContext } from "../hooks/useStore";
import { useAuth } from "../hooks/useAuth";

function readSaved(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function cartKey(owner) {
  return "royal-jewel-cart-v1:" + owner;
}

function wishlistKey(owner) {
  return "royal-jewel-wishlist-v1:" + owner;
}

function readCart(owner) {
  return readSaved(cartKey(owner), []).flatMap((item) => {
    if (!item || typeof item.productId !== "string" || typeof item.size !== "string") return [];
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) return [];
    return [{ key: item.productId + "::" + item.size, productId: item.productId, size: item.size, quantity }];
  });
}

function readWishlist(owner) {
  return [...new Set(readSaved(wishlistKey(owner), []).filter((id) => typeof id === "string"))];
}

function toStoreProduct(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  const sizes = Array.isArray(product.sizes) && product.sizes.length
    ? product.sizes
    : Array.isArray(product.variants) && product.variants.length
      ? product.variants.map((variant) => typeof variant === "string" ? variant : variant.label || variant.size || "One size")
      : ["One size"];
  return {
    ...product,
    id: product.slug,
    images,
    image: images[0] || "",
    sizes,
    oldPrice: product.oldPrice || undefined,
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    badge: product.badge || "",
    isNew: Boolean(product.isNew),
    featured: Boolean(product.featured),
    material: product.material || "",
  };
}

export default function StoreProvider({ children }) {
  const { user, accessToken, ready: authReady } = useAuth();
  const [products, setProducts] = useState(sampleProducts);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [syncedUser, setSyncedUser] = useState("");
  const userId = String(user?._id || user?.id || "");
  const activeOwner = authReady ? (userId ? "user:" + userId : "guest") : "";
  const [stateOwner, setStateOwner] = useState("");
  const visibleCart = activeOwner && stateOwner === activeOwner ? cart : [];
  const visibleWishlist = activeOwner && stateOwner === activeOwner ? wishlist : [];

  useEffect(() => {
    let active = true;
    api.products()
      .then(({ products: remoteProducts }) => {
        if (active && remoteProducts.length) setProducts(remoteProducts.map(toStoreProduct));
      })
      .catch(() => {
        // Keep the sample catalog visible while the API or MongoDB is unavailable.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    try {
      // Older versions shared one browser key across every account, so it is unsafe to migrate.
      localStorage.removeItem("royal-jewel-cart-v1");
      localStorage.removeItem("royal-jewel-wishlist-v1");
    } catch {}
    const owner = userId ? "user:" + userId : "guest";
    const cachedCart = readCart(owner);
    const cachedWishlist = readWishlist(owner);
    setCart(cachedCart);
    setWishlist(cachedWishlist);
    setStateOwner(owner);
    if (!user || !accessToken || !userId) {
      setSyncedUser("");
      return undefined;
    }
    let active = true;
    Promise.all([api.getCart(accessToken), api.getWishlist(accessToken)])
      .then(([cartResult, wishlistResult]) => {
        if (!active) return;
        const serverCart = (cartResult.cart?.items || []).map((item) => ({
          key: item.productSlug + "::" + item.size,
          productId: item.productSlug,
          size: item.size,
          quantity: item.quantity,
        }));
        const serverWishlist = wishlistResult.wishlist || [];
        if (serverCart.length) setCart(serverCart);
        else if (cachedCart.length) api.syncCart(accessToken, cachedCart.map(({ productId, size, quantity }) => ({ productSlug: productId, size, quantity }))).catch(() => {});
        if (serverWishlist.length) setWishlist(serverWishlist);
        else if (cachedWishlist.length) api.syncWishlist(accessToken, cachedWishlist).catch(() => {});
        setSyncedUser(owner);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [authReady, accessToken, userId]);

  useEffect(() => {
    if (!authReady || !accessToken || !userId || syncedUser !== activeOwner || stateOwner !== activeOwner) return;
    const timer = window.setTimeout(() => {
      api.syncCart(accessToken, visibleCart.map(({ productId, size, quantity }) => ({ productSlug: productId, size, quantity }))).catch(() => {});
      api.syncWishlist(accessToken, visibleWishlist).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authReady, accessToken, userId, activeOwner, stateOwner, syncedUser, visibleCart, visibleWishlist]);

  useEffect(() => {
    try {
      if (!activeOwner || stateOwner !== activeOwner) return;
      localStorage.setItem(cartKey(activeOwner), JSON.stringify(visibleCart));
      localStorage.setItem(wishlistKey(activeOwner), JSON.stringify(visibleWishlist));
    } catch {
      // The store still works for the current page if browser storage is unavailable.
    }
  }, [activeOwner, stateOwner, visibleCart, visibleWishlist]);

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

  const clearCart = useCallback(() => setCart([]), []);

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

  const cartCount = useMemo(() => visibleCart.reduce((total, item) => total + item.quantity, 0), [visibleCart]);
  const cartSubtotal = useMemo(() => visibleCart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0), [visibleCart, products]);

  return (
    <StoreContext.Provider value={{
      products,
      cart: visibleCart,
      wishlist: visibleWishlist,
      cartCount,
      cartSubtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      removeFromWishlist,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

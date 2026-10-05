import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContext } from "./hooks/useToast";
import SiteLayout from "./layouts/SiteLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import StoreProvider from "./components/StoreProvider";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";

function RouteFrame({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const [toast, setToast] = useState("");
  const showToast = useCallback((message) => setToast(message), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
    <StoreProvider>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<SiteLayout />}>
            <Route index element={<RouteFrame><Home /></RouteFrame>} />
            <Route path="/shop" element={<RouteFrame><Shop /></RouteFrame>} />
            <Route path="/cart" element={<RouteFrame><Cart /></RouteFrame>} />
            <Route path="/wishlist" element={<RouteFrame><Wishlist /></RouteFrame>} />
            <Route path="/product/:productId" element={<RouteFrame><ProductDetails /></RouteFrame>} />
            <Route path="/about" element={<RouteFrame><About /></RouteFrame>} />
            <Route path="/contact" element={<RouteFrame><Contact /></RouteFrame>} />
            <Route path="/gallery" element={<RouteFrame><Gallery /></RouteFrame>} />
            <Route path="/faq" element={<RouteFrame><FAQ /></RouteFrame>} />
            <Route path="/privacy" element={<RouteFrame><Privacy /></RouteFrame>} />
            <Route path="/terms" element={<RouteFrame><Terms /></RouteFrame>} />
            <Route path="*" element={<RouteFrame><NotFound /></RouteFrame>} />
          </Route>
        </Routes>
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div className="toast-message" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast}</motion.div>}
      </AnimatePresence>
    </StoreProvider>
    </ToastContext.Provider>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiHeart, FiShoppingBag } from "react-icons/fi";
import { useToast } from "../hooks/useToast";
import { useStore } from "../hooks/useStore";
import { formatINR } from "../utils/currency";

export default function ProductCard({ product, index = 0 }) {
  const showToast = useToast();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const saved = wishlist.includes(product.id);

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.28) }}
    >
      <div className="product-image-wrap">
        <Link to={"/product/" + product.id} className="product-image-link" aria-label={"View " + product.name}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className={saved ? "product-heart is-saved" : "product-heart"} type="button" aria-label={saved ? "Remove " + product.name + " from wishlist" : "Save " + product.name} aria-pressed={saved} onClick={() => {
          toggleWishlist(product.id);
          showToast(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
        }}>
          <FiHeart />
        </button>
        <Link className="product-view" to={"/product/" + product.id}>
          View piece <FiArrowUpRight />
        </Link>
      </div>
      <div className="product-info">
        <div className="product-meta"><span>{product.category}</span><span>★★★★★ <small>{product.rating.toFixed(1)}</small></span></div>
        <Link to={"/product/" + product.id} className="product-name">{product.name}</Link>
        <div className="product-price-line">
          <strong>{formatINR(product.price)}</strong>
          {product.oldPrice && <del>{formatINR(product.oldPrice)}</del>}
          <button type="button" className="product-bag" aria-label={"Add " + product.name + " to bag"} onClick={() => {
            addToCart(product);
            showToast(product.name + " added to your bag.");
          }}>
            <FiShoppingBag />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

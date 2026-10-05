import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowUpRight, FiCheck, FiHeart, FiShield, FiTruck } from "react-icons/fi";
import { products } from "../data/products";
import { usePageMeta } from "../hooks/usePageMeta";
import { useToast } from "../hooks/useToast";
import ProductCard from "../components/ProductCard";
import SectionTitle from "../components/SectionTitle";
import { useStore } from "../hooks/useStore";
import { formatINR } from "../utils/currency";
import { freeShippingThreshold } from "../data/storeSettings";

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === productId);
  const [activeImage, setActiveImage] = useState(product?.images[0] || "");
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] || "");
  const showToast = useToast();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const saved = product ? wishlist.includes(product.id) : false;
  usePageMeta(product ? product.name : "Piece not found", product?.description || "Explore the Royal Jewel collection.");

  if (!product) {
    return <section className="not-found"><div><p className="eyebrow">A LITTLE DETOUR</p><h1>Not found.</h1><p>This piece may have moved on to a new chapter.</p><Link className="button button-dark" to="/shop">Explore the collection <FiArrowUpRight /></Link></div></section>;
  }
  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.featured)).slice(0, 4);

  return (
    <>
      <div className="page-wrap">
        <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
        <section className="product-detail">
          <div className="detail-gallery">
            <div className="detail-thumbs" role="tablist" aria-label="Product photos">
              {product.images.map((image, index) => (
                <button className={activeImage === image ? "detail-thumb active" : "detail-thumb"} key={image} type="button" onClick={() => setActiveImage(image)} aria-label={"Show product photo " + (index + 1)} aria-selected={activeImage === image}>
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
            <div className="detail-main-image"><img src={activeImage} alt={product.name} /></div>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{product.category}{product.badge ? " · " + product.badge : ""}</p>
            <h1>{product.name}</h1>
            <p className="detail-price">{formatINR(product.price)} {product.oldPrice && <del className="detail-old-price">{formatINR(product.oldPrice)}</del>}</p>
            <div className="detail-rating"><span aria-label={product.rating.toFixed(1) + " out of 5 stars"}>★★★★★</span> <small>{product.rating.toFixed(1)} · {product.reviews} thoughtful reviews</small></div>
            <p className="detail-description">{product.description}</p>
            <hr className="detail-rule" />
            <p className="detail-label">Material</p>
            <p className="detail-material m-0 text-stone">{product.material}</p>
            <hr className="detail-rule" />
            <p className="detail-label">Choose your size</p>
            <div className="size-list">
              {product.sizes.map((size) => <button className={selectedSize === size ? "size-chip selected" : "size-chip"} key={size} type="button" onClick={() => setSelectedSize(size)}>{size}</button>)}
            </div>
            <div className="detail-actions">
              <button className="button button-dark" type="button" onClick={() => {
                addToCart(product, selectedSize);
                showToast(product.name + " added to your bag.");
              }}>Add to bag <FiArrowUpRight /></button>
              <button className="button border border-gold text-ink hover:bg-gold/10" type="button" onClick={() => {
                addToCart(product, selectedSize);
                showToast("Added to your bag.");
                navigate("/cart");
              }}>Buy now <FiArrowUpRight /></button>
            </div>
            <button className={saved ? "detail-save is-saved" : "detail-save"} type="button" aria-pressed={saved} onClick={() => {
              toggleWishlist(product.id);
              showToast(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
            }}><FiHeart /> {saved ? "Saved to your wishlist" : "Save to wishlist"}</button>
            <p className="detail-note">Selected: {selectedSize}. Orders are wrapped with care and ready for gifting.</p>
            <hr className="detail-rule" />
            <div className="detail-promises"><span className="flex items-center gap-2"><FiTruck className="text-gold-deep" /> Complimentary delivery over {formatINR(freeShippingThreshold)}</span><span className="flex items-center gap-2"><FiShield className="text-gold-deep" /> 30-day easy returns</span><span className="flex items-center gap-2"><FiHeart className="text-gold-deep" /> Gift-ready keepsake packaging</span><span className="flex items-center gap-2"><FiCheck className="text-gold-deep" /> Thoughtfully selected materials</span></div>
          </div>
        </section>
      </div>
      {related.length > 0 && <section className="section related-section"><div className="page-wrap"><SectionTitle eyebrow="COMPLETE THE STORY" title="You may also love." /><div className="shop-grid">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></div></section>}
    </>
  );
}

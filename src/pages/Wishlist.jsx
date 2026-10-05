import { Link } from "react-router-dom";
import { FiArrowRight, FiHeart } from "react-icons/fi";
import ProductCard from "../components/ProductCard";
import PageIntro from "../components/PageIntro";
import SectionTitle from "../components/SectionTitle";
import { products } from "../data/products";
import { useStore } from "../hooks/useStore";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Wishlist() {
  const { wishlist } = useStore();
  usePageMeta("Your Wishlist", "See the jewellery pieces you have saved in your Royal Jewel wishlist.");
  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  return (
    <>
      <PageIntro eyebrow="KEPT CLOSE" title="Your wishlist." copy="A little collection of pieces you have your eye on." />
      <section className="section page-wrap wishlist-page">
        {savedProducts.length ? (
          <>
            <div className="split-heading"><SectionTitle eyebrow="YOUR SAVED PIECES" title="For another lovely day." copy={savedProducts.length + " " + (savedProducts.length === 1 ? "piece" : "pieces") + " saved just for you."} /><span className="wishlist-count"><FiHeart /> {savedProducts.length}</span></div>
            <div className="shop-grid">{savedProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
          </>
        ) : (
          <div className="store-empty">
            <span className="store-empty-mark"><FiHeart /></span>
            <h2>Keep the ones you love close.</h2>
            <p>Tap the heart on a piece and it will be waiting here when you come back.</p>
            <Link className="button button-dark" to="/shop">Find your favorites <FiArrowRight /></Link>
          </div>
        )}
      </section>
    </>
  );
}

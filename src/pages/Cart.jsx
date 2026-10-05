import { Link } from "react-router-dom";
import { FiArrowRight, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { products } from "../data/products";
import { useStore } from "../hooks/useStore";
import { useToast } from "../hooks/useToast";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatINR } from "../utils/currency";
import { freeShippingThreshold } from "../data/storeSettings";

export default function Cart() {
  const { cart, cartCount, cartSubtotal, updateQuantity, removeFromCart } = useStore();
  const showToast = useToast();
  usePageMeta("Shopping Bag", "Review the jewellery pieces in your Royal Jewel shopping bag.");
  const items = cart.map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) })).filter((line) => line.product);
  const remaining = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  return (
    <>
      <PageIntro eyebrow="YOUR SELECTION" title="Your shopping bag." copy="The little things you chose, gathered in one place." />
      <div className="page-wrap">
        <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Shopping bag</span></div>
        <section className="section-tight cart-page">
          {items.length === 0 ? (
            <div className="store-empty">
              <span className="store-empty-mark">✧</span>
              <h2>Your bag is waiting.</h2>
              <p>Find a little something to make your day.</p>
              <Link className="button button-dark" to="/shop">Explore the collection <FiArrowRight /></Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                <div className="cart-list-heading"><h2>Your pieces <span>({cartCount})</span></h2><Link to="/shop">Continue shopping <FiArrowRight /></Link></div>
                {items.map(({ key, product, size, quantity }) => (
                  <article className="cart-line" key={key}>
                    <Link className="cart-line-image" to={"/product/" + product.id}><img src={product.image} alt={product.name} /></Link>
                    <div className="cart-line-info">
                      <p className="product-category">{product.category}</p>
                      <Link className="cart-line-name" to={"/product/" + product.id}>{product.name}</Link>
                      <span className="cart-line-size">Size: {size}</span>
                      <div className="quantity-control">
                        <button type="button" aria-label={"Decrease " + product.name + " quantity"} disabled={quantity <= 1} onClick={() => updateQuantity(key, -1)}><FiMinus /></button>
                        <span>{quantity}</span>
                        <button type="button" aria-label={"Increase " + product.name + " quantity"} onClick={() => updateQuantity(key, 1)}><FiPlus /></button>
                      </div>
                    </div>
                    <div className="cart-line-end">
                      <strong>{formatINR(product.price * quantity)}</strong>
                      <button className="remove-line" type="button" onClick={() => removeFromCart(key)} aria-label={"Remove " + product.name}><FiTrash2 /><span>Remove</span></button>
                    </div>
                  </article>
                ))}
              </div>
              <aside className="cart-summary-card">
                <p className="eyebrow">A THOUGHTFUL FINISH</p>
                <h2>Order summary</h2>
                <div className="shipping-progress-copy">{remaining === 0 ? "Your order qualifies for complimentary delivery." : "Add " + formatINR(remaining) + " for complimentary delivery."}</div>
                <div className="shipping-progress"><span style={{ width: progress + "%" }} /></div>
                <div className="summary-row"><span>Subtotal · {cartCount} {cartCount === 1 ? "piece" : "pieces"}</span><strong>{formatINR(cartSubtotal)}</strong></div>
                <div className="summary-row"><span>Delivery</span><strong>{remaining === 0 ? "Complimentary" : "Calculated later"}</strong></div>
                <div className="summary-total"><span>Estimated total</span><strong>{formatINR(cartSubtotal)}</strong></div>
                <p className="cart-tax-note">Taxes and any delivery charge are confirmed at checkout. This preview does not place an order.</p>
                <button className="button button-dark cart-checkout" type="button" onClick={() => showToast("Checkout is a demo; no payment will be taken.")}>Continue to checkout <FiArrowRight /></button>
                <div className="cart-promise">✧ &nbsp; Thoughtfully wrapped and ready to gift</div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

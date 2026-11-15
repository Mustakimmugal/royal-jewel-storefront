import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../hooks/useAuth";
import { usePageMeta } from "../hooks/usePageMeta";
import { useStore } from "../hooks/useStore";
import { api } from "../api/client";
import { freeShippingThreshold } from "../data/storeSettings";
import { formatINR } from "../utils/currency";

const standardShippingFee = 250;

export default function Checkout() {
  const { ready, user, accessToken } = useAuth();
  const { products, cart, cartCount, cartSubtotal, clearCart } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const selectedAddress = addresses.find((address) => address._id === selectedAddressId);
  usePageMeta("Checkout", "Confirm your delivery details and place your MH JEWELLERS order.");
  const items = cart.map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) })).filter((line) => line.product);
  const shipping = cartSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;

  useEffect(() => {
    if (!accessToken) return;
    api.getAddresses(accessToken).then(({ addresses: saved }) => {
      setAddresses(saved);
      setSelectedAddressId(saved.find((address) => address.isDefault)?._id || "");
    }).catch(() => {});
  }, [accessToken]);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      await api.syncCart(accessToken, cart.map(({ productId, size, quantity }) => ({ productSlug: productId, size, quantity })));
      const result = await api.applyCoupon(accessToken, couponCode.trim());
      setCouponCode(result.couponCode);
      setAppliedCoupon(result);
    } catch (couponRequestError) {
      setAppliedCoupon(null);
      setCouponError(couponRequestError.message || "This coupon could not be applied.");
    }
  }

  if (!ready) return <section className="section page-wrap"><p>Checking your account…</p></section>;
  if (!user) return <Navigate to="/login?next=/checkout" replace />;
  if (!order && items.length === 0) return <Navigate to="/cart" replace />;

  async function submitOrder(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.delete("couponCode");
    const shippingAddress = Object.fromEntries(form.entries());
    setBusy(true);
    setError("");
    try {
      const result = await api.createOrder(accessToken, {
        items: cart.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
        shippingAddress,
        ...(appliedCoupon ? { couponCode: appliedCoupon.couponCode } : {}),
      });
      if (!selectedAddress) {
        const saved = await api.saveAddress(accessToken, { ...shippingAddress, label: "Home", isDefault: addresses.length === 0 }).catch(() => null);
        if (saved?.address) setAddresses((current) => current.concat(saved.address));
      }
      setOrder(result.order);
      clearCart();
    } catch (orderError) {
      setError(orderError.message || "We could not place this order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="A THOUGHTFUL FINISH" title={order ? "Order received." : "Your delivery details."} copy={order ? "Thank you. We will keep you updated as your order progresses." : "Confirm where your MH JEWELLERS pieces should be delivered."} />
      <section className="section page-wrap checkout-page">
        {order ? (
          <div className="checkout-success">
            <span className="checkout-success-mark"><FiCheck /></span>
            <p className="eyebrow">ORDER CONFIRMED</p>
            <h2>Thank you for your order.</h2>
            <p>Your order number is <strong>{order.orderNumber}</strong>. Payment is due on delivery.</p>
            <p className="checkout-total">{formatINR(order.total)}</p>
            <Link className="button button-dark" to="/shop">Continue shopping <FiArrowRight /></Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-form" key={selectedAddressId || "manual-address"} onSubmit={submitOrder}>
              <p className="eyebrow">DELIVERY ADDRESS</p>
              <h2>Where should we send it?</h2>
              {addresses.length > 0 && <div className="form-field form-field-wide checkout-saved-address"><label htmlFor="saved-address">Saved address</label><select id="saved-address" value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}><option value="">Enter a new address</option>{addresses.map((address) => <option key={address._id} value={address._id}>{address.label || "Address"} · {address.city}, {address.region}</option>)}</select></div>}
              <div className="form-grid">
                <div className="form-field form-field-wide"><label htmlFor="recipient">Recipient name</label><input id="recipient" name="recipient" autoComplete="name" defaultValue={selectedAddress?.recipient || ""} required /></div>
                <div className="form-field form-field-wide"><label htmlFor="address-phone">Delivery mobile number</label><input id="address-phone" name="phone" type="tel" autoComplete="tel" defaultValue={selectedAddress?.phone || user.phone || ""} required /></div>
                <div className="form-field form-field-wide"><label htmlFor="line1">Address</label><input id="line1" name="line1" autoComplete="address-line1" defaultValue={selectedAddress?.line1 || ""} required /></div>
                <div className="form-field form-field-wide"><label htmlFor="line2">Apartment, suite or landmark (optional)</label><input id="line2" name="line2" autoComplete="address-line2" defaultValue={selectedAddress?.line2 || ""} /></div>
                <div className="form-field"><label htmlFor="city">City</label><input id="city" name="city" autoComplete="address-level2" defaultValue={selectedAddress?.city || ""} required /></div>
                <div className="form-field"><label htmlFor="region">State / region</label><input id="region" name="region" autoComplete="address-level1" defaultValue={selectedAddress?.region || ""} required /></div>
                <div className="form-field"><label htmlFor="postalCode">Postal code</label><input id="postalCode" name="postalCode" autoComplete="postal-code" defaultValue={selectedAddress?.postalCode || ""} required /></div>
                <div className="form-field"><label htmlFor="country">Country</label><input id="country" name="country" autoComplete="country-name" defaultValue={selectedAddress?.country || "India"} required /></div>
              </div>
              <div className="checkout-coupon">
                <label htmlFor="checkout-coupon-code">Coupon code</label>
                <div><input id="checkout-coupon-code" name="couponCode" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); setCouponError(""); }} placeholder="Enter a code" /><button type="button" className="admin-text-button" onClick={applyCoupon} disabled={!couponCode.trim()}>Apply</button></div>
                {couponError && <small role="alert">{couponError}</small>}
                {appliedCoupon && <small role="status">{appliedCoupon.couponCode} applied.</small>}
              </div>
              <div className="payment-choice"><strong>Payment method</strong><label><input type="radio" checked readOnly /> Cash on delivery</label><small>Online payment will be available after the payment provider is configured.</small></div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Placing order…" : "Place COD order"} <FiArrowRight /></button>
            </form>
            <aside className="checkout-summary">
              <p className="eyebrow">YOUR ORDER</p>
              <h2>Order summary</h2>
              {items.map(({ key, product, size, quantity }) => (
                <div className="checkout-item" key={key}>
                  <img src={product.image} alt="" />
                  <div><strong>{product.name}</strong><small>{size} · Qty {quantity}</small></div>
                  <span>{formatINR(product.price * quantity)}</span>
                </div>
              ))}
              <div className="summary-row"><span>Subtotal · {cartCount} pieces</span><strong>{formatINR(cartSubtotal)}</strong></div>
              <div className="summary-row"><span>Delivery</span><strong>{shipping ? formatINR(shipping) : "Complimentary"}</strong></div>
              {appliedCoupon && <div className="summary-row"><span>Coupon discount</span><strong>−{formatINR(appliedCoupon.discount)}</strong></div>}
              <div className="summary-total"><span>Due on delivery</span><strong>{formatINR(cartSubtotal + shipping - (appliedCoupon?.discount || 0))}</strong></div>
              <p className="cart-tax-note">Prices and available stock are confirmed by the store when your order is submitted.</p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}

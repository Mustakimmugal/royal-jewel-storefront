import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiArrowRight, FiLogOut, FiPackage } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../hooks/useAuth";
import { usePageMeta } from "../hooks/usePageMeta";
import { api } from "../api/client";
import { formatINR } from "../utils/currency";

export default function Account() {
  const { user, accessToken, ready, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingOrder, setWorkingOrder] = useState("");
  const [workingProfile, setWorkingProfile] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  usePageMeta("My Account", "View your MH JEWELLERS profile and order history.");

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    api.myOrders(accessToken)
      .then(({ orders: customerOrders }) => { if (active) setOrders(customerOrders); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken]);

  useEffect(() => setProfileImage(user?.profileImage || ""), [user?.profileImage]);

  async function uploadProfileImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Choose an image up to 5 MB."); return; }
    setError("");
    setWorkingProfile(true);
    try {
      const result = await api.uploadProfileImage(accessToken, file);
      setProfileImage(result.user.profileImage || "");
    } catch (uploadError) { setError(uploadError.message); }
    finally { setWorkingProfile(false); }
  }

  async function removeProfileImage() {
    if (!profileImage) return;
    setError("");
    setWorkingProfile(true);
    try {
      const result = await api.deleteProfileImage(accessToken);
      setProfileImage(result.user.profileImage || "");
    } catch (removeError) { setError(removeError.message); }
    finally { setWorkingProfile(false); }
  }

  async function cancelOrder(orderId) {
    if (!window.confirm("Cancel this order and return its items to stock?")) return;
    setWorkingOrder(orderId);
    setError("");
    try {
      const result = await api.cancelOrder(accessToken, orderId);
      setOrders((current) => current.map((order) => order._id === orderId ? result.order : order));
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkingOrder(""); }
  }

  async function submitReturn(event) {
    event.preventDefault();
    if (!returnOrder || !returnReason.trim()) return;
    setWorkingOrder(returnOrder._id);
    setError("");
    try {
      const result = await api.requestOrderReturn(accessToken, returnOrder._id, returnReason.trim());
      setOrders((current) => current.map((order) => order._id === returnOrder._id ? result.order : order));
      setReturnOrder(null);
      setReturnReason("");
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkingOrder(""); }
  }

  if (!ready) return <section className="section page-wrap"><p>Checking your account…</p></section>;
  if (!user) return <Navigate to="/login?next=/account" replace />;

  return (
    <>
      <PageIntro eyebrow="YOUR MH JEWELLERS ACCOUNT" title="Welcome back." copy="Your verified mobile number and recent orders, together in one place." />
      <section className="section page-wrap account-page">
        <div className="account-heading">
          <div className="account-identity"><label className="account-profile-photo" title="Change profile photo"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadProfileImage} disabled={workingProfile} />{profileImage ? <img src={profileImage} alt="Profile" /> : <span>R</span>}</label><div><p className="eyebrow">ACCOUNT DETAILS</p><h2>{user.displayName || "Your account"}</h2><p>{user.phone || user.email}</p><small>{workingProfile ? "Updating photo…" : profileImage ? "Click your photo to change it" : "Click to add a profile photo"}</small>{profileImage && <button className="admin-text-button" type="button" onClick={removeProfileImage} disabled={workingProfile}>Remove photo</button>}</div></div>
          <button className="account-signout" type="button" onClick={async () => { await signOut(); window.location.assign("/"); }}><FiLogOut /> Sign out</button>
        </div>
        <div className="account-orders">
          <div className="account-orders-heading"><div><p className="eyebrow">YOUR PURCHASES</p><h2>Order history</h2></div><span>{orders.length} {orders.length === 1 ? "order" : "orders"}</span></div>
          {loading ? <p className="account-empty">Loading your orders…</p> : error ? <p className="auth-error" role="alert">{error}</p> : orders.length ? (
            <div className="account-order-list">
              {orders.map((order) => (
                <article className="account-order-card" key={order._id}>
                  <div className="account-order-top"><div><span className="account-order-number">{order.orderNumber}</span><small>{new Date(order.createdAt).toLocaleDateString()}</small></div><span className="admin-status">{order.fulfillmentStatus}</span></div>
                  <div className="account-order-items">{order.items.map((item) => <div key={item.productSlug + item.size}><img src={item.image} alt="" /><span>{item.productName}<small>{item.size} · Qty {item.quantity}</small></span><strong>{formatINR(item.lineTotal)}</strong></div>)}</div>
                  <div className="account-order-bottom"><span>{order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod} · {order.paymentStatus}</span><strong>{formatINR(order.total)}</strong></div>
                  {order.shippingAddress && <p className="account-order-address">Delivering to {order.shippingAddress.city}, {order.shippingAddress.country}</p>}
                  {order.returnRequest?.isRequested && <p className="account-order-address">Return request: {order.returnRequest.status}</p>}
                  <div className="account-order-actions">
                    {["pending", "processing"].includes(order.fulfillmentStatus) && <button type="button" className="admin-text-button" disabled={workingOrder === order._id} onClick={() => cancelOrder(order._id)}>{workingOrder === order._id ? "Please wait…" : "Cancel order"}</button>}
                    {order.fulfillmentStatus === "delivered" && !order.returnRequest?.isRequested && <button type="button" className="admin-text-button" disabled={workingOrder === order._id} onClick={() => { setError(""); setReturnReason(""); setReturnOrder(order); }}>{workingOrder === order._id ? "Please wait…" : "Request a return"}</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="account-empty"><FiPackage /><h3>No orders just yet.</h3><p>Your confirmed purchases will appear here.</p><Link className="button button-dark" to="/shop">Explore the collection <FiArrowRight /></Link></div>
          )}
        </div>
      </section>
      {returnOrder && <div className="return-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !workingOrder) setReturnOrder(null); }}>
        <section className="return-modal" role="dialog" aria-modal="true" aria-labelledby="return-modal-title">
          <p className="eyebrow">ORDER {returnOrder.orderNumber}</p>
          <h2 id="return-modal-title">Request a return</h2>
          <p className="return-modal-timeline">After your return is approved, allow an estimated <strong>5–7 business days</strong> for the refund to be processed. COD refunds are handled manually, so our team may contact you for payout details.</p>
          <form onSubmit={submitReturn}>
            <label htmlFor="return-reason">Reason for return</label>
            <textarea id="return-reason" value={returnReason} onChange={(event) => setReturnReason(event.target.value)} maxLength={1000} rows={4} required placeholder="Tell us why you would like to return this order." />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="return-modal-actions">
              <button className="button button-light" type="button" onClick={() => setReturnOrder(null)} disabled={Boolean(workingOrder)}>Cancel</button>
              <button className="button button-dark" type="submit" disabled={Boolean(workingOrder) || !returnReason.trim()}>{workingOrder ? "Submitting…" : "Submit request"}</button>
            </div>
          </form>
        </section>
      </div>}
    </>
  );
}

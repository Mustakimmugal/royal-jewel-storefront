import { Badge, paymentMethods, paymentStates, statusLabels } from "../components/OrderStatus";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiAlertTriangle, FiArchive, FiLayers, FiPlus, FiTrash2, FiArrowLeft, FiArrowRight, FiBox, FiChevronRight, FiClipboard, FiImage, FiLoader, FiLogOut, FiMail, FiPackage, FiRefreshCw, FiRotateCcw, FiTag, FiUsers } from "react-icons/fi";
import { api } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { formatINR } from "../utils/currency";

const statusTransitions = {
  pending: ["processing", "cancelled"],
  processing: ["packed", "shipped", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["pending", "processing", "packed", "shipped", "refund"],
  cancelled: [],
  refund: [],
};


function emptyImageSlots() {
  return [null, null, null, null];
}

function imageSlotsForProduct(product) {
  const images = product?.images || [];
  const publicIds = product?.imagePublicIds || [];
  return Array.from({ length: 4 }, (_, index) => {
    const url = images[index];
    if (!url) return null;
    let publicId = "";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parsed.hostname === "res.cloudinary.com" && parts[1] === "image" && parts[2] === "upload") {
        let idParts = parts.slice(3);
        if (idParts[0] && /^v\d+$/.test(idParts[0])) idParts = idParts.slice(1);
        const last = idParts.at(-1) || "";
        idParts[idParts.length - 1] = last.replace(/\.[a-z0-9]+$/i, "");
        const fromUrl = idParts.join("/");
        if (publicIds.includes(fromUrl)) publicId = fromUrl;
      }
    } catch {}
    return { url, publicId, file: null };
  });
}

export default function AdminDashboard() {
  const { user, accessToken, ready, signOut } = useAuth();
  const showToast = useToast();
  const [section, setSection] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [imageSlots, setImageSlots] = useState(emptyImageSlots);
  const [uploadProgress, setUploadProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    const result = await api.adminProducts(accessToken);
    setProducts(result.products);
  }

  async function loadOrders() {
    const result = await api.adminOrders(accessToken);
    setOrders(result.orders);
  }

  async function loadMessages() {
    const result = await api.adminMessages(accessToken);
    setMessages(result.messages);
  }

  async function loadDashboard() {
    const result = await api.adminDashboardStats(accessToken);
    setDashboard(result);
  }

  async function loadCustomers() {
    const result = await api.adminCustomers(accessToken);
    setCustomers(result.customers);
  }

  async function loadCategories() {
    const result = await api.categories();
    setCategories(result.categories);
  }

  async function loadCoupons() {
    const result = await api.adminCoupons(accessToken);
    setCoupons(result.coupons);
  }

  useEffect(() => {
    if (!accessToken) return;
    const tasks = [loadProducts(), loadCategories(), loadOrders(), loadMessages(), loadDashboard(), loadCustomers()];
    if (user?.role === "admin") tasks.push(loadCoupons());
    Promise.all(tasks).catch((loadError) => setError(loadError.message));
  }, [accessToken, user?.role]);

  async function saveProduct(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const values = Object.fromEntries(formData.entries());
    const filesToUpload = imageSlots.map((slot, index) => slot?.file ? { file: slot.file, index } : null).filter(Boolean);
    const name = String(values.name).trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name,
      slug,
      sku: String(values.sku || ("MH-" + Date.now().toString(36))).trim().toUpperCase(),
      category: String(values.category),
      collection: String(values.collection || ""),
      description: String(values.description || name).trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      currency: "INR",
      images: [],
      imagePublicIds: [],
      sizes: String(values.sizes).split(",").map((size) => size.trim()).filter(Boolean),
      material: String(values.material || ""),
      featured: values.featured === "on",
      badge: String(values.badge || ""),
      isNew: values.isNew === "on",
      isActive: true,
    };

    setBusy(true);
    setError("");
    setMessage("");
    const uploadedPublicIds = [];
    let productSaved = false;
    try {
      if (filesToUpload.some(({ file }) => file.size > 5 * 1024 * 1024)) throw new Error("Each image must be 5 MB or smaller.");
      let uploadedBySlot = new Map();
      if (filesToUpload.length) {
        let completedUploads = 0;
        setUploadProgress(`Uploading 0 of ${filesToUpload.length}…`);
        const uploadResults = await Promise.allSettled(filesToUpload.map(async ({ file }) => {
          const result = await api.uploadProductImage(accessToken, file);
          uploadedPublicIds.push(result.image.publicId);
          completedUploads += 1;
          setUploadProgress(`Uploaded ${completedUploads} of ${filesToUpload.length}…`);
          return result;
        }));
        const failedUpload = uploadResults.find((result) => result.status === "rejected");
        if (failedUpload) throw failedUpload.reason;
        uploadedBySlot = new Map(filesToUpload.map(({ index }, resultIndex) => [index, uploadResults[resultIndex].value.image]));
      }
      const finalImages = imageSlots.map((slot, index) => {
        if (!slot) return null;
        const uploaded = uploadedBySlot.get(index);
        return uploaded || { url: slot.url, publicId: slot.publicId };
      }).filter(Boolean);
      payload.images = finalImages.map((image) => image.url);
      payload.imagePublicIds = finalImages.map((image) => image.publicId).filter(Boolean);
      if (!payload.images.length) throw new Error("Add an image URL or upload at least one product photo.");
      if (editingProduct) await api.updateProduct(accessToken, editingProduct._id, payload);
      else await api.createProduct(accessToken, payload);
      productSaved = true;
      if (editingProduct) {
        const removedImageIds = (editingProduct.imagePublicIds || []).filter((publicId) => !payload.imagePublicIds.includes(publicId));
        if (removedImageIds.length) await api.cleanupProductImages(accessToken, removedImageIds).catch(() => showToast("Product updated, but an old Cloudinary photo could not be removed."));
      }
      formElement.reset();
      setImageSlots(emptyImageSlots());
      setMessage(editingProduct ? "Product updated." : "Product added to the catalogue.");
      showToast(editingProduct ? "Product updated successfully." : "Product added successfully.");
      setEditingProduct(null);
      setSection("products");
      await loadProducts();
    } catch (saveError) {
      if (!productSaved && uploadedPublicIds.length) await api.cleanupProductImages(accessToken, uploadedPublicIds).catch(() => {});
      setError(saveError.message);
      showToast(saveError.message || "Product could not be saved.");
    } finally {
      setUploadProgress("");
      setBusy(false);
    }
  }

  async function deleteProduct() {
    if (!pendingDelete) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.deleteProduct(accessToken, pendingDelete._id);
      await loadProducts();
      setMessage("Product deleted. Existing orders were preserved.");
      showToast("Product permanently deleted. Existing orders are preserved.");
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
      showToast(deleteError.message || "Product could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function setPaymentStatus(orderId, changes) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.updatePaymentStatus(accessToken, orderId, changes);
      setOrders(current => current.map(order => order._id === orderId ? { ...order, ...result.order, userId: order.userId } : order));
      setMessage("Payment status updated.");
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLocation(event, order) {
    event.preventDefault();
    const form = event.currentTarget;
    const location = form.elements.location.value.trim();
    if (!location) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.updateOrderLocation(accessToken, order._id, order.fulfillmentStatus, location);
      setOrders(current => current.map(currentOrder => currentOrder._id === order._id ? { ...currentOrder, ...result.order, userId: currentOrder.userId } : currentOrder));
      form.reset();
      setMessage("Tracking location updated.");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function setOrderStatus(orderId, status) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api.updateOrderStatus(accessToken, orderId, status);
      setOrders(current => current.map(order => order._id === orderId ? { ...order, ...result.order, userId: order.userId } : order));
      setMessage("Order status updated.");
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  async function setMessageStatus(messageId, status) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.updateMessageStatus(accessToken, messageId, status);
      await loadMessages();
      setMessage("Message status updated.");
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusy(false);
    }
  }

  async function setReturnStatus(orderId, status) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.reviewReturn(accessToken, orderId, status);
      await loadOrders();
      setMessage("Return request " + status + ".");
    } catch (statusError) { setError(statusError.message); }
    finally { setBusy(false); }
  }

  async function saveCoupon(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = Object.fromEntries(new FormData(formElement).entries());
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.createCoupon(accessToken, {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount || 0),
        maxDiscount: Number(formData.maxDiscount || 0),
        usageLimit: Number(formData.usageLimit || 0),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      });
      formElement.reset();
      await loadCoupons();
      setMessage("Coupon created.");
    } catch (saveError) { setError(saveError.message); }
    finally { setBusy(false); }
  }

  async function toggleCoupon(coupon) {
    setBusy(true);
    setError("");
    try {
      await api.updateCoupon(accessToken, coupon._id, { isActive: !coupon.isActive });
      await loadCoupons();
    } catch (updateError) { setError(updateError.message); }
    finally { setBusy(false); }
  }
  if (!ready) return <main className="admin-loading">Checking admin access…</main>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!["admin", "employee"].includes(user.role)) {
    return <main className="admin-loading"><h1>Admin access required</h1><p>This account does not have dashboard access.</p><Link to="/">Return to MH JEWELLERS</Link></main>;
  }

  const stats = dashboard?.stats || {};
  const paidRevenue = stats.totalRevenue ?? orders.filter((order) => order.fulfillmentStatus === "delivered").reduce((sum, order) => sum + order.total, 0);
  const openOrders = orders.filter((order) => !["delivered", "cancelled", "refund"].includes(order.fulfillmentStatus)).length;
  const lowStock = products.filter((product) => product.stock <= 3 && !product.isArchived).length;
  const newMessages = messages.filter((entry) => entry.status === "new").length;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand"><span>MH</span><strong>MH JEWELLERS<small>STORE ADMIN</small></strong></Link>
        <nav aria-label="Admin navigation">
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><FiClipboard /> Overview</button>
          <button className={section === "products" ? "active" : ""} onClick={() => setSection("products")}><FiBox /> Products</button>
          <button className={section === "add-product" ? "active" : ""} onClick={() => { setEditingProduct(null); setImageSlots(emptyImageSlots()); setSection("add-product"); }}><FiPackage /> Add product</button>
          <button className={section === "categories" ? "active" : ""} onClick={() => setSection("categories")}><FiLayers /> Categories</button>
          <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}><FiArchive /> Orders</button>
          <button className={section === "returns" ? "active" : ""} onClick={() => setSection("returns")}><FiRotateCcw /> Returns</button>
          <button className={section === "customers" ? "active" : ""} onClick={() => setSection("customers")}><FiUsers /> Customers</button>
          {user.role === "admin" && <button className={section === "coupons" ? "active" : ""} onClick={() => setSection("coupons")}><FiTag /> Coupons</button>}
          <button className={section === "messages" ? "active" : ""} onClick={() => setSection("messages")}><FiMail /> Messages{newMessages ? " (" + newMessages + ")" : ""}</button>
        </nav>
        <button className="admin-signout" onClick={async () => { await signOut(); window.location.assign("/"); }}><FiLogOut /> Sign out</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="eyebrow">MH JEWELLERS ADMIN</p><h1>{section === "overview" ? "Store overview" : section === "products" ? "Products" : section === "add-product" ? editingProduct ? "Edit product" : "Add a product" : section === "categories" ? "Categories" : section === "orders" ? "Orders" : section === "returns" ? "Return requests" : section === "customers" ? "Customers" : section === "coupons" ? "Coupons" : "Messages"}</h1></div>
          <div className="admin-topbar-actions">
            <Link className="admin-back-link" to="/"><FiArrowLeft /> Back to store</Link>
            <button className="admin-refresh" onClick={() => Promise.all([loadProducts(), loadCategories(), loadOrders(), loadMessages(), loadDashboard(), loadCustomers(), ...(user.role === "admin" ? [loadCoupons()] : [])]).catch((loadError) => setError(loadError.message))}><FiRefreshCw /> Refresh</button>
          </div>
        </header>
        <div className="admin-welcome">Signed in as <strong>{user.displayName || user.phone}</strong><FiChevronRight /> <span>{user.role}</span></div>
        {message && <p className="admin-message" role="status">{message}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}

        {section === "overview" && (
          <>
            <div className="admin-metrics">
              <article><span>Total revenue</span><strong>{formatINR(paidRevenue)}</strong><small>Completed orders · COD and online</small></article>
              <article><span>Total orders</span><strong>{stats.totalOrders ?? orders.length}</strong><small>{openOrders} awaiting fulfilment</small></article>
              <article><span>Products</span><strong>{stats.totalProducts ?? products.filter((product) => !product.isArchived).length}</strong><small>{lowStock} at low stock</small></article>
              <article><span>Customers</span><strong>{stats.totalCustomers ?? 0}</strong><small>Active customer accounts</small></article>
              <article><span>Delivered</span><strong>{stats.deliveredOrders ?? 0}</strong><small>Completed orders</small></article>
              <article><span>Pending</span><strong>{stats.pendingOrders ?? 0}</strong><small>Awaiting processing</small></article>
              <article><span>Shipped</span><strong>{stats.shippedOrders ?? 0}</strong><small>On the way</small></article>
              <article><span>Cancelled</span><strong>{stats.cancelledOrders ?? 0}</strong><small>Cancelled orders</small></article>
              <article><span>New messages</span><strong>{newMessages}</strong><small>{messages.length} total in inbox</small></article>
            </div>
            <section className="admin-card">
              <div className="admin-card-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent orders</h2></div><button onClick={() => setSection("orders")}>All orders <FiChevronRight /></button></div>
              {(dashboard?.recentOrders || orders).length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>{(dashboard?.recentOrders || orders).slice(0, 6).map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.userId?.displayName || order.userId?.phone || order.userId?.email || "Customer"}</td><td>{formatINR(order.total)}</td><td><Badge value={order.paymentStatus} labels={paymentStates} /></td><td><Badge value={order.fulfillmentStatus} /></td></tr>)}</tbody></table></div> : <p className="admin-empty">Orders will appear here after the first customer purchase.</p>}
            </section>
          </>
        )}

        {section === "products" && (
            <section className="admin-card">
              <div className="admin-card-heading"><div><p className="eyebrow">CATALOGUE</p><h2>Product inventory</h2></div><button onClick={() => { setEditingProduct(null); setImageSlots(emptyImageSlots()); setSection("add-product"); }}>Add product <FiChevronRight /></button></div>
            {products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th><th></th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><strong>{product.name}</strong></td><td>{product.sku}</td><td>{product.category}</td><td>{formatINR(product.price)}</td><td>{product.stock}</td><td>{product.isArchived ? "Archived" : product.isActive ? "Active" : "Hidden"}</td><td><div className="admin-row-actions">{!product.isArchived && <button className="admin-text-button" disabled={busy} onClick={() => { setEditingProduct(product); setImageSlots(imageSlotsForProduct(product)); setSection("add-product"); }}>Edit</button>}<button className="admin-text-button admin-delete-button" disabled={busy} onClick={() => setPendingDelete(product)}>Delete</button></div></td></tr>)}</tbody></table></div> : <p className="admin-empty">No products in MongoDB yet. Add a real product when its price, photos, materials, and stock are confirmed.</p>}
          </section>
        )}

        {section === "categories" && (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="eyebrow">CATALOGUE</p><h2>Product categories</h2></div></div>
            <form className="category-create-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(""); try { await api.createCategory(accessToken, categoryName); setCategoryName(""); await loadCategories(); setMessage("Category added."); } catch (saveError) { setError(saveError.message); } finally { setBusy(false); } }}>
              <label htmlFor="category-name">New category name</label><div><input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={80} required placeholder="For example, Pendant Sets" /><button className="button button-dark" disabled={busy}><FiPlus /> Add category</button></div>
            </form>
            {categories.length ? <div className="category-admin-list">{categories.map((category) => <article key={category._id}><span><FiLayers /><strong>{category.name}</strong></span><button type="button" className="admin-text-button admin-delete-button" disabled={busy} onClick={async () => { if (!window.confirm("Delete the category “" + category.name + "”?")) return; setBusy(true); setError(""); try { await api.deleteCategory(accessToken, category._id); await loadCategories(); setMessage("Category deleted."); } catch (removeError) { setError(removeError.message); } finally { setBusy(false); } }}><FiTrash2 /> Delete</button></article>)}</div> : <p className="admin-empty">No saved categories yet. Add a category above.</p>}
          </section>
        )}

        {section === "add-product" && (
          <section className="admin-card admin-product-editor">
            <p className="eyebrow">{editingProduct ? "EDIT CATALOGUE ITEM" : "NEW CATALOGUE ITEM"}</p><h2>Product details</h2>
            <form className="admin-form" key={editingProduct?._id || "new-product"} onSubmit={saveProduct}>
              <label>Product name<input name="name" defaultValue={editingProduct?.name || ""} required maxLength={160} /></label>
              <label>SKU <small className="optional-label">Optional</small><input name="sku" defaultValue={editingProduct?.sku || ""} maxLength={40} placeholder="Auto generated if empty" /></label>
              <label>Category<span className="category-select-wrap"><select name="category" defaultValue={editingProduct?.category || ""} required><option value="">Choose category</option>{[...new Set([...categories.map((category) => category.name), editingProduct?.category].filter(Boolean))].map((name) => <option key={name}>{name}</option>)}</select><FiChevronRight aria-hidden="true" /></span><small className="category-field-hint">Manage options on the Categories page.</small></label>
              <label>Collection<input name="collection" defaultValue={editingProduct?.collection || ""} maxLength={80} /></label>
              <label>Price (INR)<input name="price" type="number" min="0" step="1" defaultValue={editingProduct?.price ?? ""} required /></label>
              <label>Stock<input name="stock" type="number" min="0" step="1" defaultValue={editingProduct?.stock ?? 0} /></label>
              <label>Sizes, comma-separated<input name="sizes" defaultValue={(editingProduct?.sizes || []).join(", ")} placeholder="16 in, 18 in" /></label>
              <label>Material<input name="material" defaultValue={editingProduct?.material || ""} maxLength={300} /></label>
              <label className="admin-wide">Description <small className="optional-label">Optional</small><textarea name="description" defaultValue={editingProduct?.description || ""} maxLength={8000} rows="4" placeholder="Add product details when available" /></label>
              <div className="admin-wide">
                <p className="admin-image-upload-title">Product photos (up to 4). Existing photos appear in their boxes; choose a new photo to replace one.</p>
                <div className="admin-image-upload-grid">
                  {imageSlots.map((slot, index) => <div className="admin-image-slot" key={index}>
                    <label className="admin-image-upload-box" htmlFor={`product-image-${index}`}>
                      {slot?.url && <img src={slot.url} alt={`Product photo ${index + 1}`} />}
                      <span className="admin-image-upload-copy"><FiImage aria-hidden="true" /><strong>Image {index + 1}</strong><span>{slot?.file?.name || (slot?.url ? "Click to replace" : "Choose a photo")}</span></span>
                      <input id={`product-image-${index}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0] || null; if (file) setImageSlots((current) => current.map((existing, slotIndex) => slotIndex === index ? { file, url: "", publicId: "" } : existing)); }} />
                    </label>
                    {slot && <button className="admin-image-remove" type="button" onClick={() => { const input = document.getElementById(`product-image-${index}`); if (input) input.value = ""; setImageSlots((current) => current.map((existing, slotIndex) => slotIndex === index ? null : existing)); }} aria-label={`Remove image ${index + 1}`}>Remove</button>}
                  </div>)}
                </div>
                {imageSlots.some((slot) => slot?.file) && <small className="admin-image-selected-count">{imageSlots.filter((slot) => slot?.file).length} replacement photo(s) selected · selected photos upload together</small>}
              </div>
              <label>Product label <small className="optional-label">Optional</small><select name="badge" defaultValue={editingProduct?.badge || ""}><option value="">No label</option><option value="Bestseller">Bestseller</option><option value="Limited">Limited edition</option><option value="Wedding edit">Wedding edit</option><option value="Handcrafted">Handcrafted</option><option value="Sale">Sale</option></select></label>
              <label className="admin-checkbox"><input name="featured" type="checkbox" defaultChecked={editingProduct?.featured || false} /> Featured on home</label>
              <label className="admin-checkbox"><input name="isNew" type="checkbox" defaultChecked={editingProduct?.isNew || false} /> New arrival</label>
              <div className="admin-wide"><button className="button button-dark" type="submit" disabled={busy}>{busy ? <><FiLoader className="loading-spinner" /> {uploadProgress || (editingProduct ? "Updating product…" : "Saving product…")}</> : <>{editingProduct ? "Save changes" : "Save product"} <FiArrowRight /></>}</button></div>
            </form>
            <p className="admin-footnote">Choose up to four JPG, PNG, WebP, or AVIF photos (5 MB each). Replace or remove photos in their boxes, then save all changes together. Deleting the product also deletes its Cloudinary photos. Configure the Cloudinary keys in backend/.env to enable uploads.</p>
          </section>
        )}

        {section === "orders" && (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="eyebrow">ORDER MANAGEMENT</p><h2>Customer orders</h2></div></div>
            {orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th><th>Tracking location</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleDateString()}</small></td><td>{order.userId?.displayName || order.userId?.phone || order.userId?.email || "Customer"}</td><td>{formatINR(order.total)}</td><td>{[["paymentMethod", paymentMethods], ["paymentStatus", paymentStates]].map(([field, labels]) => (
                  <select key={field} className="order-badge" data-state={order[field]} value={order[field]}
                    aria-label={(field === "paymentMethod" ? "Payment method for " : "Payment status for ") + order.orderNumber}
                    disabled={busy || order.paymentStatus === "refunded" || ["cancelled", "refund"].includes(order.fulfillmentStatus)}
                    onChange={event => setPaymentStatus(order._id, { [field]: event.target.value })}>
                    {Object.entries(labels).filter(([key]) => key !== "refunded" || order[field] === key).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                ))}</td><td><Badge value={order.fulfillmentStatus} /></td><td><select value={order.fulfillmentStatus} disabled={busy || ["cancelled", "refund"].includes(order.fulfillmentStatus)} onChange={(event) => setOrderStatus(order._id, event.target.value)} aria-label={"Update " + order.orderNumber + " status"}>{[order.fulfillmentStatus, ...(statusTransitions[order.fulfillmentStatus] || [])].map((status) => <option key={status} value={status}>{statusLabels[status] || status}</option>)}</select></td><td><form onSubmit={event => saveLocation(event, order)}><input name="location" maxLength={120} required placeholder="City or delivery hub" aria-label={"Tracking location for " + order.orderNumber} /><button className="admin-text-button" disabled={busy}>Add update</button></form></td></tr>)}</tbody></table></div> : <p className="admin-empty">No orders have been placed yet.</p>}
          </section>
        )}
        {section === "returns" && (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="eyebrow">CUSTOMER CARE</p><h2>Return requests</h2></div></div>
            {orders.filter((order) => order.returnRequest?.isRequested).length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Review</th></tr></thead><tbody>{orders.filter((order) => order.returnRequest?.isRequested).map((order) => <tr key={order._id}><td>{order.orderNumber}</td><td>{order.userId?.displayName || order.userId?.email || "Customer"}</td><td>{order.returnRequest.reason}</td><td>{order.returnRequest.status}</td><td>{order.returnRequest.status === "pending" ? <div className="admin-row-actions"><button className="admin-text-button" disabled={busy} onClick={() => setReturnStatus(order._id, "approved")}>Approve</button><button className="admin-text-button" disabled={busy} onClick={() => setReturnStatus(order._id, "rejected")}>Decline</button></div> : order.returnRequest.adminNote || "—"}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No return requests have been submitted.</p>}
          </section>
        )}
        {section === "customers" && (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="eyebrow">CUSTOMER ACCOUNTS</p><h2>{dashboard?.stats?.totalCustomers ?? customers.length} customers</h2></div></div>
            {customers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>State</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer._id}><td>{customer.displayName || "—"}</td><td>{customer.email || "—"}</td><td>{customer.phone || "—"}</td><td>{new Date(customer.createdAt).toLocaleDateString()}</td><td>{customer.isActive ? "Active" : "Disabled"}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Customer accounts will appear here.</p>}
          </section>
        )}
        {section === "coupons" && user.role === "admin" && (
          <>
            <section className="admin-card">
              <div className="admin-card-heading"><div><p className="eyebrow">PROMOTIONS</p><h2>Create coupon</h2></div></div>
              <form className="admin-form" onSubmit={saveCoupon}>
                <label>Code<input name="code" required maxLength="40" pattern="[A-Za-z0-9_-]{3,40}" /></label>
                <label>Discount type<select name="discountType" defaultValue="PERCENTAGE"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label>
                <label>Discount value<input name="discountValue" type="number" min="1" step="0.01" required /></label>
                <label>Expiry date<input name="expiryDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
                <label>Minimum order (INR)<input name="minOrderAmount" type="number" min="0" step="1" defaultValue="0" /></label>
                <label>Maximum discount (INR)<input name="maxDiscount" type="number" min="0" step="1" defaultValue="0" /></label>
                <label>Usage limit (0 = unlimited)<input name="usageLimit" type="number" min="0" step="1" defaultValue="0" /></label>
                <div className="admin-wide"><button className="button button-dark" type="submit" disabled={busy}>{busy ? "Saving…" : "Create coupon"}</button></div>
              </form>
            </section>
            <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">AVAILABLE OFFERS</p><h2>Coupons</h2></div></div>
              {coupons.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Code</th><th>Offer</th><th>Expiry</th><th>Usage</th><th>State</th><th></th></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon._id}><td><strong>{coupon.code}</strong></td><td>{coupon.discountType === "PERCENTAGE" ? coupon.discountValue + "%" : formatINR(coupon.discountValue)}</td><td>{new Date(coupon.expiryDate).toLocaleDateString()}</td><td>{coupon.usedCount}{coupon.usageLimit ? " / " + coupon.usageLimit : ""}</td><td>{coupon.isActive ? "Active" : "Inactive"}</td><td><button className="admin-text-button" disabled={busy} onClick={() => toggleCoupon(coupon)}>{coupon.isActive ? "Disable" : "Enable"}</button></td></tr>)}</tbody></table></div> : <p className="admin-empty">No coupons have been created yet.</p>}
            </section>
          </>
        )}
        {section === "messages" && (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="eyebrow">CUSTOMER CARE</p><h2>Contact inbox</h2></div></div>
            {messages.length ? <div className="admin-message-list">{messages.map((entry) => (
              <article className="admin-message-card" key={entry._id}>
                <div className="admin-message-head">
                  <div><strong>{entry.subject}</strong><small>{entry.name} · <a href={"mailto:" + entry.email}>{entry.email}</a> · {new Date(entry.createdAt).toLocaleString()}</small></div>
                  <select value={entry.status} disabled={busy} onChange={(event) => setMessageStatus(entry._id, event.target.value)} aria-label={"Update message from " + entry.name}>
                    {["new", "read", "replied", "closed"].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <p className="admin-message-body">{entry.message}</p>
              </article>
            ))}</div> : <p className="admin-empty">New contact notes will appear here.</p>}
          </section>
        )}      </main>
      {pendingDelete && <div className="product-delete-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setPendingDelete(null); }}>
        <section className="product-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="product-delete-title" aria-describedby="product-delete-copy">
          <div className="product-delete-warning-icon"><FiAlertTriangle /></div>
          <p className="product-delete-eyebrow">PERMANENT ACTION</p>
          <h2 id="product-delete-title">Permanently delete product?</h2>
          <p id="product-delete-copy"><strong>{pendingDelete.name}</strong> and its stored photos, reviews, cart entries, and wishlist entries will be deleted permanently. Existing customer orders and their saved item details will stay.</p>
          <div className="product-delete-actions">
            <button className="button button-light" type="button" onClick={() => setPendingDelete(null)} disabled={busy}>Cancel</button>
            <button className="button product-delete-confirm" type="button" onClick={deleteProduct} disabled={busy}>{busy ? <><FiLoader className="loading-spinner" /> Deleting…</> : "Permanently delete"}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}

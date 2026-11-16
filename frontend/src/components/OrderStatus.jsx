export const paymentMethods = { COD: "Cash on delivery", online: "Online", offline: "Offline" };
export const paymentStates = { pending: "Unpaid", processing: "Processing", paid: "Paid", failed: "Failed", refunded: "Refunded" };
export const statusLabels = {
  pending: "Pending", processing: "Processing", packed: "Packed", shipped: "Shipped / On the way",
  delivered: "Delivered", cancelled: "Cancelled", refund: "Refund",
};

export function Badge({ value, labels = statusLabels }) {
  return <span className="order-badge" data-state={value}>{labels[value] || value}</span>;
}

export function Tracking({ order }) {
  const updates = order.trackingHistory || [];
  const latestLocation = [...updates].reverse().find(update => update.location);
  return <details className="order-tracking">
    <summary>Track order</summary>
    {latestLocation && <p>Last reported location · <strong>{latestLocation.location}</strong> · {new Date(latestLocation.at).toLocaleString()}</p>}
    <ol>
      <li><strong>Order placed</strong><time>{new Date(order.createdAt).toLocaleString()}</time></li>
      {updates.map((update, index) => <li key={index}>
        <Badge value={update.status} /> {update.location}
        <time>{new Date(update.at).toLocaleString()}</time>
      </li>)}
      {!updates.length && <li>Current status <Badge value={order.fulfillmentStatus} /></li>}
    </ol>
  </details>;
}

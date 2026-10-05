import { usePageMeta } from "../hooks/usePageMeta";
import PageIntro from "../components/PageIntro";

export default function Terms() {
  usePageMeta("Terms and Conditions", "Sample terms and conditions for the Royal Jewel static storefront.");
  return (
    <>
      <PageIntro eyebrow="THE IMPORTANT DETAILS" title="Terms & conditions." copy="A starting point for this non-transactional website preview." />
      <section className="section page-wrap legal-copy">
        <p className="eyebrow">Last updated: October 2026</p>
        <p>This is sample copy for a static website prototype, not final terms for a real retail business. Replace these terms with business-specific details before accepting customer orders.</p>
        <h2>About this website</h2>
        <p>This site presents example products, descriptions, and prices for design review. It is not a live store. Product buttons, the bag, wishlist, and forms do not create an order or send personal information.</p>
        <h2>Product details and imagery</h2>
        <p>Photography, descriptions, availability, materials, and prices are illustrative placeholders. A retailer should confirm each product statement and its image usage rights before publication.</p>
        <h2>Orders, payments, and delivery</h2>
        <p>No checkout, payment, shipping, or order management service is connected to this prototype. A future store should publish its accurate purchasing, tax, delivery, cancellation, refund, and exchange terms.</p>
        <h2>Questions</h2>
        <p>For a live business, provide the correct legal business name, place of operation, and contact information on this page.</p>
      </section>
    </>
  );
}

import { usePageMeta } from "../hooks/usePageMeta";
import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";

export default function Privacy() {
  usePageMeta("Privacy Policy", "A sample privacy policy page for the Royal Jewel static storefront.");
  return (
    <>
      <PageIntro eyebrow="THE IMPORTANT DETAILS" title="Privacy policy." copy="A plain-language starting point for this static storefront preview." />
      <section className="section page-wrap legal-copy">
        <p className="eyebrow">Last updated: October 2026</p>
        <p>This sample page describes the demo as delivered. It is not a final policy for a real jewellery business. Before launch, replace it with the business's own privacy terms and contact details.</p>
        <h2>Information on this demo site</h2>
        <p>This static preview does not include a backend, account system, analytics service, checkout, or order database. The newsletter and contact forms only show an on-screen confirmation and do not send or save submissions.</p>
        <h2>Product images and fonts</h2>
        <p>Product and editorial placeholders load from Pexels, and the page may load typefaces from Google Fonts. Those services may receive standard technical information, such as a browser request and network address, when the assets are requested.</p>
        <h2>Cookies and local storage</h2>
        <p>The cart and wishlist are saved in this browser's local storage so they remain available after refresh; they are not sent to a server. This preview does not use cookies for store accounts or purchases. If new tools are added later, describe their data use here before publishing the site.</p>
        <h2>Questions</h2>
        <p>For an actual shop, add a monitored business email address and a process for privacy requests on the <Link className="text-link" to="/contact">Contact page</Link>.</p>
      </section>
    </>
  );
}

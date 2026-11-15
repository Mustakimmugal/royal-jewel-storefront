import { useState } from "react";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { api } from "../api/client";
import { usePageMeta } from "../hooks/usePageMeta";
import { mapEmbedUrl, mapsUrl, storeAddress, storeEmail, whatsappUrl } from "../data/storeSettings";
import PageIntro from "../components/PageIntro";

export default function Contact() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  usePageMeta("Contact Us", "Get in touch with the MH JEWELLERS team.");

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const values = Object.fromEntries(new FormData(formElement).entries());
    setBusy(true);
    setError("");
    setSent(false);
    try {
      await api.submitContact({
        name: String(values.name),
        email: String(values.email),
        subject: String(values.subject),
        message: String(values.message),
      });
      formElement.reset();
      setSent(true);
    } catch (submitError) {
      setError(submitError.message || "Your note could not be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="WE'RE HERE FOR YOU" title="Say hello." copy="Questions about a piece, a gift, or something else? We would love to hear from you." image="https://images.pexels.com/photos/12194363/pexels-photo-12194363.jpeg?auto=compress&cs=tinysrgb&w=1500" />
      <section className="section page-wrap">
        <div className="contact-grid">
          <aside className="contact-info-card">
            <p className="eyebrow">A REAL PERSON, SOON</p>
            <h2>We are just a note away.</h2>
            <div className="contact-method"><FiMail /><div><strong>Email</strong><small><a href={"mailto:" + storeEmail}>{storeEmail}</a></small></div></div>
            <div className="contact-method"><FiPhone /><div><strong>WhatsApp</strong><small><a href={whatsappUrl} target="_blank" rel="noreferrer">+91 91193 24328</a></small></div></div>
            <div className="contact-method"><FiMapPin /><div><strong>Store address</strong><small><a href={mapsUrl} target="_blank" rel="noreferrer">{storeAddress}</a></small></div></div>
            <iframe className="store-map" title="Map of Subhash Chowk, Sikar" src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </aside>
          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="eyebrow">SEND US A NOTE</p>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" placeholder="Name" required maxLength={100} /></div>
              <div className="form-field"><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="you@example.com" required maxLength={254} /></div>
              <div className="form-field form-field-wide"><label htmlFor="contact-subject">What can we help with?</label><select id="contact-subject" name="subject"><option>Choosing a piece</option><option>Order question</option><option>Care and materials</option><option>Something else</option></select></div>
              <div className="form-field form-field-wide"><label htmlFor="contact-message">Your message</label><textarea id="contact-message" name="message" placeholder="Tell us a little more..." required minLength={5} maxLength={5000} /></div>
            </div>
            {sent && <p className="contact-result" role="status">Thank you. Your note has reached our team.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Sending…" : "Send your note"} <span>→</span></button>
          </form>
        </div>
      </section>
    </>
  );
}
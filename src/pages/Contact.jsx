import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { useToast } from "../hooks/useToast";
import { usePageMeta } from "../hooks/usePageMeta";
import PageIntro from "../components/PageIntro";

export default function Contact() {
  const showToast = useToast();
  usePageMeta("Contact Us", "Get in touch with the Royal Jewel team.");

  function handleSubmit(event) {
    event.preventDefault();
    showToast("Thanks for reaching out. This contact form is a static preview.");
    event.currentTarget.reset();
  }

  return (
    <>
      <PageIntro eyebrow="WE'RE HERE FOR YOU" title="Say hello." copy="Questions about a piece, a gift, or something else? We would love to hear from you." image="https://images.pexels.com/photos/12194363/pexels-photo-12194363.jpeg?auto=compress&cs=tinysrgb&w=1500" />
      <section className="section page-wrap">
        <div className="contact-grid">
          <aside className="contact-info-card">
            <p className="eyebrow">A REAL PERSON, SOON</p>
            <h2>We are just a note away.</h2>
            <p>For this static website preview, the details below are placeholders. Replace them with your store's contact information before launch.</p>
            <div className="contact-method"><FiMail /><div><strong>Email</strong><small>hello@royaljewel.example</small></div></div>
            <div className="contact-method"><FiPhone /><div><strong>Phone</strong><small>+91 00000 00000</small></div></div>
            <div className="contact-method"><FiClock /><div><strong>Hours</strong><small>Monday–Saturday, 10 am–6 pm</small></div></div>
            <div className="contact-method"><FiMapPin /><div><strong>Studio</strong><small>Mumbai, India · By appointment</small></div></div>
          </aside>
          <form className="contact-form" onSubmit={handleSubmit}>
            <p className="eyebrow">SEND US A NOTE</p>
            <div className="form-grid">
              <div className="form-field"><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" placeholder="Name" required /></div>
              <div className="form-field"><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="you@example.com" required /></div>
              <div className="form-field form-field-wide"><label htmlFor="contact-subject">What can we help with?</label><select id="contact-subject" name="subject"><option>Choosing a piece</option><option>Order question</option><option>Care and materials</option><option>Something else</option></select></div>
              <div className="form-field form-field-wide"><label htmlFor="contact-message">Your message</label><textarea id="contact-message" name="message" placeholder="Tell us a little more..." required /></div>
            </div>
            <button className="button button-dark" type="submit">Send your note <span>→</span></button>
            <p className="detail-note">This demo form does not send or store your message.</p>
          </form>
        </div>
      </section>
    </>
  );
}

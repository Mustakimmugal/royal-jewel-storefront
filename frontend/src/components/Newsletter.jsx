import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { api } from "../api/client";
import { useToast } from "../hooks/useToast";

export default function Newsletter({ compact = false }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      await api.subscribeNewsletter(email);
      showToast("Thanks for joining our little circle.");
      setEmail("");
    } catch (error) {
      showToast(error.message || "We could not save your subscription. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "newsletter newsletter-compact" : "newsletter"}>
      {!compact && <span className="newsletter-star">✧</span>}
      <p className="eyebrow">{compact ? "A NOTE FROM US" : "GOOD THINGS, OCCASIONALLY"}</p>
      <h2>{compact ? "A little sparkle in your inbox." : "A little note, a little light."}</h2>
      <p className="newsletter-copy">New pieces, considered stories, and a thoughtful treat on your birthday.</p>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          aria-label="Your email address"
          autoComplete="email"
          maxLength={254}
          required
        />
        <button type="submit" aria-label="Join the newsletter" disabled={busy}><FiArrowUpRight /></button>
      </form>
      <small className="newsletter-fineprint">By joining, you agree to receive occasional Royal Jewellers updates.</small>
    </div>
  );
}
import { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { useToast } from "../hooks/useToast";

export default function Newsletter({ compact = false }) {
  const [email, setEmail] = useState("");
  const showToast = useToast();

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;
    showToast("Thanks for joining our little circle.");
    setEmail("");
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
          required
        />
        <button type="submit" aria-label="Join the newsletter"><FiArrowUpRight /></button>
      </form>
      <small className="newsletter-fineprint">By joining, you agree to receive occasional Royal Jewel updates.</small>
    </div>
  );
}

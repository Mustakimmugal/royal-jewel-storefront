import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../hooks/useAuth";
import { usePageMeta } from "../hooks/usePageMeta";
import PasswordField from "../components/PasswordField";

function redirectTarget(params, signedInUser) {
  if (signedInUser && signedInUser.role !== "customer") return "/admin";
  const target = params.get("next");
  if (target && target.startsWith("/") && !target.startsWith("//")) return target;
  return "/";
}

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  usePageMeta("Sign in", "Sign in to your MH JEWELLERS account with email and password.");

  useEffect(() => {
    if (!ready || !user) return;
    navigate(redirectTarget(params, user), { replace: true });
  }, [ready, user, params, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setError("");
    setBusy(true);
    try {
      const signedInUser = await signIn(String(values.email), String(values.password));
      navigate(redirectTarget(params, signedInUser), { replace: true });
    } catch (signInError) {
      setError(signInError.message || "We could not sign you in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="YOUR MH JEWELLERS ACCOUNT" title="A little closer." copy="Sign in to place orders and manage your account. You can browse the collection without signing in." />
      <section className="section page-wrap auth-page">
        <div className="auth-panel">
          <p className="eyebrow">EMAIL AND PASSWORD</p>
          <h2>Sign in to continue.</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
            <label htmlFor="login-password">Password</label>
            <PasswordField id="login-password" autoComplete="current-password" minLength={6} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <FiArrowRight /></button>
          </form>
          <p className="auth-copy"><Link to="/forgot-password">Forgot password?</Link></p>
          <p className="auth-copy">New to MH JEWELLERS? <Link to="/register">Create an account</Link></p>
          <p className="auth-footnote">You can shop without signing in. An account is required to place an order.</p>
          <Link className="auth-shop-link" to="/shop">Continue browsing <FiArrowUpRight /></Link>
        </div>
      </section>
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import PasswordField from "../components/PasswordField";
import { api } from "../api/client";
import { usePageMeta } from "../hooks/usePageMeta";

export default function ForgotPassword() {
  const [stage, setStage] = useState("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [error, setError] = useState("");
  usePageMeta("Forgot password", "Recover your MH JEWELLERS account password.");

  async function findRecoveryQuestions(event) {
    event.preventDefault();
    const nextEmail = String(new FormData(event.currentTarget).get("email") || "").trim();
    setEmail(nextEmail);
    setBusy(true);
    setError("");
    setFallbackVisible(false);
    try {
      const result = await api.startPasswordRecovery(nextEmail);
      setEmail(nextEmail);
      setToken(result.token);
      setQuestions(result.recoveryQuestions);
      setStage("answers");
    } catch (requestError) {
      setError(requestError.message || "We could not start recovery. Check your email and try again.");
      setFallbackVisible(true);
    } finally { setBusy(false); }
  }

  async function sendEmailResetLink() {
    setBusy(true);
    setError("");
    try {
      await api.requestPasswordReset(email);
      setEmailLinkSent(true);
    } catch (requestError) {
      setError(requestError.message || "We could not send a reset link. Please try again.");
    } finally { setBusy(false); }
  }

  async function verifyAnswers(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const recoveryAnswers = questions
      .map(({ id }) => ({ questionId: id, answer: String(values.get(id) || "").trim() }))
      .filter(({ answer }) => answer);
    if (!recoveryAnswers.length) {
      setError("Enter at least one recovery answer.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.verifyPasswordRecovery(email, token, recoveryAnswers);
      setStage("password");
    } catch (requestError) {
      setError(requestError.message || "The recovery answers could not be verified.");
    } finally { setBusy(false); }
  }

  async function updatePassword(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") || "");
    if (password !== String(values.get("confirmPassword") || "")) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.completePasswordRecovery(email, token, password);
      setDone(true);
      setStage("done");
    } catch (requestError) {
      setError(requestError.message || "We could not update your password. Please verify your answers again.");
      if (requestError.message?.toLowerCase().includes("verify")) setStage("answers");
    } finally { setBusy(false); }
  }

  return (
    <>
      <PageIntro eyebrow="ACCOUNT RECOVERY" title="Find your way back." copy="Verify the recovery answers on your account, then choose a new password." />
      <section className="section page-wrap auth-page">
        <div className="auth-panel">
          <p className="eyebrow">RESET YOUR PASSWORD</p>
          <h2>{done ? "Password updated." : stage === "email" ? "Forgot your password?" : stage === "answers" ? "Verify your answers." : "Choose a new password."}</h2>
          {stage === "done" ? <><p className="auth-copy" role="status">Your password has been changed. Sign in with your new password.</p><Link className="button button-dark" to="/login">Go to sign in <FiArrowRight /></Link></> : emailLinkSent ? <p className="auth-copy" role="status">If an account matches that email, a secure reset link has been sent. Open it to continue recovery.</p> : stage === "email" ? (
            <form className="auth-form" onSubmit={findRecoveryQuestions}>
              <label htmlFor="forgot-email">Email address</label>
              <input id="forgot-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
              {error && <p className="auth-error" role="alert">{error}</p>}
              {fallbackVisible && email && <button className="admin-text-button" type="button" disabled={busy} onClick={sendEmailResetLink}>Try a secure reset link sent by email</button>}
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Checking account…" : "Continue"} <FiArrowRight /></button>
            </form>
          ) : stage === "answers" ? (
            <form className="auth-form" onSubmit={verifyAnswers}>
              <p className="auth-copy">Answer the recovery questions saved on <strong>{email}</strong>.</p>
              <p className="auth-copy">At least one correct answer is required. You can leave the other answer blank.</p>
              {questions.map(({ id, label }, index) => <div key={id}><label htmlFor={"recovery-" + id}>Recovery answer {index + 1}: {label}</label><input id={"recovery-" + id} name={id} minLength={3} maxLength={120} autoComplete="off" /></div>)}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Checking answers…" : "Verify answers"} <FiArrowRight /></button>
              <button className="admin-text-button" type="button" disabled={busy} onClick={() => { setStage("email"); setError(""); }}>Use a different email</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={updatePassword}>
              <p className="auth-copy">Recovery answers verified for <strong>{email}</strong>. Set a password of at least 6 characters.</p>
              <label htmlFor="forgot-new-password">New password</label>
              <PasswordField id="forgot-new-password" autoComplete="new-password" minLength={6} />
              <label htmlFor="forgot-confirm-password">Confirm new password</label>
              <PasswordField id="forgot-confirm-password" name="confirmPassword" autoComplete="new-password" minLength={6} />
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Updating password…" : "Update password"} <FiArrowRight /></button>
            </form>
          )}
          {!done && <p className="auth-footnote">Recovery expires after 30 minutes. Five incorrect answer attempts will temporarily lock recovery.</p>}
          <p className="auth-copy"><Link to="/login">Back to sign in</Link></p>
        </div>
      </section>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { api } from "../api/client";
import { usePageMeta } from "../hooks/usePageMeta";
import PasswordField from "../components/PasswordField";

const questionChoices = [
  ["favorite_color", "What is your favorite color?"],
  ["favorite_food", "What is your favorite food?"],
  ["first_school", "What was the name of your first school?"],
  ["first_pet", "What was the name of your first pet?"],
  ["childhood_nickname", "What was your childhood nickname?"],
  ["first_concert", "What was the first concert you attended?"],
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  usePageMeta("Reset password", "Set a new password for your Royal Jewellers account.");

  useEffect(() => {
    let active = true;
    api.passwordResetInfo(email, token)
      .then((result) => { if (active) setInfo(result); })
      .catch((requestError) => { if (active) setError(requestError.message || "This reset link is invalid or expired."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [email, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.password !== values.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = { email, token, password: String(values.password) };
    if (info.needsRecoverySetup) {
      payload.newRecoveryAnswers = [
        { questionId: String(values.question1), answer: String(values.answer1) },
        { questionId: String(values.question2), answer: String(values.answer2) },
      ];
    } else {
      payload.recoveryAnswers = info.recoveryQuestions.map(({ id }) => ({ questionId: id, answer: String(values[id] || "") }));
    }
    try {
      await api.resetPassword(payload);
      setDone(true);
    } catch (resetError) {
      setError(resetError.message || "We could not reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="ACCOUNT RECOVERY" title="A fresh start." copy="Confirm your recovery answers and choose a new password." />
      <section className="section page-wrap auth-page">
        <div className="auth-panel">
          <p className="eyebrow">PASSWORD RESET</p>
          <h2>{done ? "Password updated." : "Set a new password."}</h2>
          {loading ? <p className="auth-copy">Checking your reset link…</p> : done ? (
            <><p className="auth-copy" role="status">Your password has been changed. Sign in with the new password.</p><Link className="button button-dark" to="/login">Go to sign in <FiArrowRight /></Link></>
          ) : info ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              {info.needsRecoverySetup ? (
                <>
                  <p className="auth-copy">This older account has no recovery questions yet. Choose two now.</p>
                  <label htmlFor="reset-question-1">Recovery question 1</label>
                  <select id="reset-question-1" name="question1" defaultValue="favorite_color">{questionChoices.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
                  <label htmlFor="reset-answer-1">Answer 1</label>
                  <input id="reset-answer-1" name="answer1" minLength={3} maxLength={120} autoComplete="off" required />
                  <label htmlFor="reset-question-2">Recovery question 2</label>
                  <select id="reset-question-2" name="question2" defaultValue="favorite_food">{questionChoices.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
                  <label htmlFor="reset-answer-2">Answer 2</label>
                  <input id="reset-answer-2" name="answer2" minLength={3} maxLength={120} autoComplete="off" required />
                </>
              ) : info.recoveryQuestions.map(({ id, label }, index) => (
                <div key={id}>
                  <label htmlFor={"recovery-" + id}>Recovery answer {index + 1}: {label}</label>
                  <input id={"recovery-" + id} name={id} autoComplete="off" required />
                </div>
              ))}
              <label htmlFor="reset-password">New password</label>
              <PasswordField id="reset-password" autoComplete="new-password" minLength={6} />
              <label htmlFor="reset-confirm-password">Confirm new password</label>
              <PasswordField id="reset-confirm-password" name="confirmPassword" autoComplete="new-password" minLength={6} />
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Updating password…" : "Update password"} <FiArrowRight /></button>
            </form>
          ) : <p className="auth-error" role="alert">{error || "This reset link is invalid or expired."}</p>}
          {!done && <p className="auth-footnote">For account safety, the reset link expires after 30 minutes and can only be used once.</p>}
          <p className="auth-copy"><Link to="/login">Back to sign in</Link></p>
        </div>
      </section>
    </>
  );
}

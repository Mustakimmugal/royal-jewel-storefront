import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../hooks/useAuth";
import { usePageMeta } from "../hooks/usePageMeta";
import PasswordField from "../components/PasswordField";

const recoveryQuestionChoices = [
  ["favorite_color", "What is your favorite color?"],
  ["favorite_food", "What is your favorite food?"],
  ["first_school", "What was the name of your first school?"],
  ["first_pet", "What was the name of your first pet?"],
  ["childhood_nickname", "What was your childhood nickname?"],
  ["first_concert", "What was the first concert you attended?"],
];

export default function Register() {
  const navigate = useNavigate();
  const { registerAccount, user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  usePageMeta("Create an account", "Create a Royal Jewellers account with an email and password.");

  useEffect(() => {
    if (ready && user) navigate(user.role === "customer" ? "/" : "/admin", { replace: true });
  }, [ready, user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    if (values.password !== values.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const signedInUser = await registerAccount({
        email: String(values.email),
        displayName: String(values.displayName),
        password: String(values.password),
        recoveryAnswers: [
          { questionId: String(values.question1), answer: String(values.answer1) },
          { questionId: String(values.question2), answer: String(values.answer2) },
        ],
      });
      navigate(signedInUser.role === "customer" ? "/" : "/admin", { replace: true });
    } catch (registerError) {
      setError(registerError.message || "We could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="JOIN ROYAL JEWELLERS" title="A new beginning." copy="Create an account with your email and password. Browse freely and sign in when you are ready to order." />
      <section className="section page-wrap auth-page">
        <div className="auth-panel">
          <p className="eyebrow">CREATE YOUR ACCOUNT</p>
          <h2>Register with us.</h2>
          <p className="auth-copy">Choose two recovery questions and remember your answers for password resets.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="register-name">Full name</label>
            <input id="register-name" name="displayName" autoComplete="name" minLength={2} maxLength={100} placeholder="Your name" required />
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
            <label htmlFor="register-password">Password</label>
            <PasswordField id="register-password" autoComplete="new-password" minLength={6} />
            <label htmlFor="register-confirm-password">Confirm password</label>
            <PasswordField id="register-confirm-password" name="confirmPassword" autoComplete="new-password" minLength={6} />
            <label htmlFor="register-question-1">Recovery question 1</label>
            <select id="register-question-1" name="question1" defaultValue="favorite_color">{recoveryQuestionChoices.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            <label htmlFor="register-answer-1">Answer 1</label>
            <input id="register-answer-1" name="answer1" minLength={3} maxLength={120} autoComplete="off" required />
            <label htmlFor="register-question-2">Recovery question 2</label>
            <select id="register-question-2" name="question2" defaultValue="favorite_food">{recoveryQuestionChoices.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            <label htmlFor="register-answer-2">Answer 2</label>
            <input id="register-answer-2" name="answer2" minLength={3} maxLength={120} autoComplete="off" required />
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"} <FiArrowRight /></button>
          </form>
          <p className="auth-footnote">Passwords and recovery answers are stored as one-way hashes. A recovery email link is also required to reset a password.</p>
          <p className="auth-copy">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </>
  );
}

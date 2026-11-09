import { config } from "../config.js";

export async function sendAccountEmail({ to, subject, text, html }) {
  if (config.emailMode === "console" && config.nodeEnv !== "production") {
    // Never print the message body: password reset emails contain one-time secrets.
    console.info(JSON.stringify({ event: "email.dev_only", subject }));
    return;
  }
  if (config.emailMode !== "resend") {
    throw new Error("Email delivery is not configured. Set EMAIL_MODE=resend or use console in local development.");
  }
  if (!config.resendApiKey || !config.emailFrom) throw new Error("Email provider credentials are incomplete.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + config.resendApiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.emailFrom, to: [to], subject, text, html }),
  });
  if (!response.ok) throw new Error("Email provider rejected the account email.");
}

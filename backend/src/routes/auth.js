import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { PasswordResetChallenge } from "../models/PasswordResetChallenge.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { User } from "../models/User.js";
import { sendAccountEmail } from "../services/email.js";
import { deleteCloudinaryImages, uploadCloudinaryImage } from "../services/cloudinary.js";
import { hashPassword, hashRecoveryAnswer, verifyPassword, verifyRecoveryAnswer } from "../services/passwords.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false });
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const recoveryQuestions = {
  favorite_color: "What is your favorite color?",
  favorite_food: "What is your favorite food?",
  first_school: "What was the name of your first school?",
  first_pet: "What was the name of your first pet?",
  childhood_nickname: "What was your childhood nickname?",
  first_concert: "What was the first concert you attended?",
};
const refreshCookie = "royal_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
};
function hashToken(value) {
  return createHash("sha256").update(value).digest("hex");
}
function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function validPassword(value) {
  return typeof value === "string" && value.length >= 6 && value.length <= 128;
}
function parseRecoveryAnswers(value) {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const answers = value.map((entry) => ({
    questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
    answer: typeof entry?.answer === "string" ? entry.answer.trim() : "",
  }));
  if (answers.some((entry) => !recoveryQuestions[entry.questionId] || entry.answer.length < 3 || entry.answer.length > 120)) return null;
  if (answers[0].questionId === answers[1].questionId) return null;
  return answers;
}
function sessionUser(user) {
  return { id: user.id, phone: user.phone || "", email: user.email || "", displayName: user.displayName, profileImage: user.profileImage || "", role: user.role, permissions: user.permissions };
}
function accessTokenFor(user) {
  return jwt.sign(
    { role: user.role, permissions: user.permissions },
    config.accessSecret,
    { subject: user.id, issuer: "royal-jewellers-api", expiresIn: config.accessTokenTtl },
  );
}
async function startSession(user, res) {
  const rawToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);
  await RefreshSession.create({ userId: user.id, tokenHash: hashToken(rawToken), expiresAt });
  res.cookie(refreshCookie, rawToken, cookieOptions);
  return { accessToken: accessTokenFor(user), user: sessionUser(user) };
}

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    const password = req.body?.password;
    const answers = parseRecoveryAnswers(req.body?.recoveryAnswers);
    if (!validEmail(email) || displayName.length < 2 || displayName.length > 100 || !validPassword(password) || !answers) {
      return res.status(400).json({ error: { code: "INVALID_REGISTRATION", message: "Enter a valid name and email, a password of at least 6 characters, and two different recovery questions with answers." } });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ error: { code: "ACCOUNT_EXISTS", message: "An account already uses this email. Sign in or reset its password." } });
    }
    const recoveryHashes = [];
    for (const { questionId, answer } of answers) recoveryHashes.push({ questionId, answerHash: await hashRecoveryAnswer(answer) });
    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, displayName, passwordHash, recoveryAnswers: recoveryHashes, role: "customer", permissions: [] });
    return res.status(201).json(await startSession(user, res));
  } catch (error) {
    return next(error);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!validEmail(email) || typeof password !== "string" || password.length > 128) {
      return res.status(400).json({ error: { code: "INVALID_CREDENTIALS", message: "Enter your email and password." } });
    }
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.isActive || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect. Use Forgot password if this is an older account." } });
    }
    return res.json(await startSession(user, res));
  } catch (error) {
    return next(error);
  }
});

router.post("/password/recovery/start", recoveryLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } });
    const user = await User.findOne({ email }).select("recoveryAnswers");
    if (!user || user.recoveryAnswers?.length !== 2) {
      return res.status(400).json({ error: { code: "RECOVERY_UNAVAILABLE", message: "We could not start recovery. Check the email or sign in to your account." } });
    }
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const current = await PasswordResetChallenge.findOne({ email });
    if (current && current.expiresAt > now) {
      if (current.attempts >= 5) return res.status(429).json({ error: { code: "RECOVERY_LOCKED", message: "Too many incorrect attempts. Try again after 30 minutes." } });
      current.tokenHash = hashToken(token);
      current.verifiedAt = null;
      await current.save();
    } else {
      await PasswordResetChallenge.findOneAndUpdate(
        { email },
        { email, tokenHash: hashToken(token), attempts: 0, verifiedAt: null, expiresAt: new Date(now.getTime() + 30 * 60 * 1000), createdAt: now },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    return res.json({ token, recoveryQuestions: user.recoveryAnswers.map(({ questionId }) => ({ id: questionId, label: recoveryQuestions[questionId] })) });
  } catch (error) { return next(error); }
});

router.post("/password/recovery/verify", resetLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const suppliedAnswers = Array.isArray(req.body?.recoveryAnswers) ? req.body.recoveryAnswers : [];
    const answers = suppliedAnswers
      .filter((entry) => typeof entry?.answer === "string" && entry.answer.trim())
      .map((entry) => ({
        questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
        answer: entry.answer.trim(),
      }));
    const validAnswers = answers.length >= 1 && answers.length <= 2
      && answers.every((entry) => recoveryQuestions[entry.questionId] && entry.answer.length >= 3 && entry.answer.length <= 120)
      && new Set(answers.map((entry) => entry.questionId)).size === answers.length;
    const challenge = await PasswordResetChallenge.findOne({ email, tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    const user = challenge && validAnswers ? await User.findOne({ email }).select("recoveryAnswers") : null;
    if (!challenge || challenge.attempts >= 5 || !user || user.recoveryAnswers?.length !== 2) {
      return res.status(400).json({ error: { code: "RECOVERY_INVALID", message: "The email or recovery answers could not be verified." } });
    }
    let matches = false;
    for (const candidate of answers) {
      const stored = user.recoveryAnswers.find((entry) => entry.questionId === candidate.questionId);
      if (stored && await verifyRecoveryAnswer(candidate.answer, stored.answerHash)) matches = true;
    }
    if (!matches) {
      challenge.attempts += 1;
      await challenge.save();
      return res.status(challenge.attempts >= 5 ? 429 : 400).json({ error: { code: challenge.attempts >= 5 ? "RECOVERY_LOCKED" : "RECOVERY_ANSWERS_INVALID", message: challenge.attempts >= 5 ? "Too many incorrect attempts. Try again after 30 minutes." : "The recovery answers did not match." } });
    }
    challenge.verifiedAt = new Date();
    await challenge.save();
    return res.json({ verified: true });
  } catch (error) { return next(error); }
});

router.post("/password/recovery/complete", resetLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = req.body?.password;
    if (!validEmail(email) || !token || !validPassword(password)) return res.status(400).json({ error: { code: "INVALID_RESET", message: "Enter a password of at least 6 characters." } });
    const challenge = await PasswordResetChallenge.findOne({ email, tokenHash: hashToken(token), expiresAt: { $gt: new Date() }, verifiedAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } });
    const user = challenge ? await User.findOne({ email }) : null;
    if (!challenge || !user) return res.status(400).json({ error: { code: "RECOVERY_NOT_VERIFIED", message: "Verify your recovery answers again before updating the password." } });
    user.passwordHash = await hashPassword(password);
    await user.save();
    await PasswordResetChallenge.deleteOne({ _id: challenge._id });
    await RefreshSession.deleteMany({ userId: user.id });
    return res.json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) { return next(error); }
});

router.post("/password/forgot", recoveryLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email)) return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } });
    const user = await User.findOne({ email });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const now = new Date();
      const current = await PasswordResetChallenge.findOne({ email });
      if (current && current.expiresAt > now) {
        if (current.attempts >= 5) return res.json({ message: "If an account matches that email, recovery instructions have been sent." });
        current.tokenHash = hashToken(token);
        current.verifiedAt = null;
        await current.save();
      } else {
        await PasswordResetChallenge.findOneAndUpdate(
          { email },
          { email, tokenHash: hashToken(token), attempts: 0, verifiedAt: null, expiresAt: new Date(now.getTime() + 30 * 60 * 1000), createdAt: now },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
      const resetUrl = config.clientOrigin.replace(/\/$/, "") + "/reset-password?email=" + encodeURIComponent(email) + "&token=" + encodeURIComponent(token);
      await sendAccountEmail({
        to: email,
        subject: "Reset your Royal Jewellers password",
        text: "Use this one-time link within 30 minutes to reset your password: " + resetUrl,
        html: `<p>Use this one-time link within 30 minutes to reset your Royal Jewellers password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
      });
    }
    return res.json({ message: "If an account matches that email, password recovery instructions have been sent." });
  } catch (error) {
    return next(error);
  }
});

router.get("/password/reset-info", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query?.email);
    const token = typeof req.query?.token === "string" ? req.query.token : "";
    if (!validEmail(email) || !token) return res.status(400).json({ error: { code: "RESET_LINK_INVALID", message: "This reset link is invalid or expired." } });
    const challenge = await PasswordResetChallenge.findOne({ email, tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    const user = challenge ? await User.findOne({ email }).select("recoveryAnswers") : null;
    if (!challenge || !user) return res.status(400).json({ error: { code: "RESET_LINK_INVALID", message: "This reset link is invalid or expired." } });
    const saved = user.recoveryAnswers || [];
    return res.json({
      needsRecoverySetup: saved.length !== 2,
      recoveryQuestions: saved.map((answer) => ({ id: answer.questionId, label: recoveryQuestions[answer.questionId] })),
      availableQuestions: saved.length === 2 ? [] : Object.entries(recoveryQuestions).map(([id, label]) => ({ id, label })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/password/reset", resetLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = req.body?.password;
    if (!validEmail(email) || !token || !validPassword(password)) {
      return res.status(400).json({ error: { code: "INVALID_RESET", message: "Enter a valid reset link and a password of at least 6 characters." } });
    }
    const challenge = await PasswordResetChallenge.findOne({ email, tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
    const user = challenge ? await User.findOne({ email }) : null;
    if (!challenge || !user) return res.status(400).json({ error: { code: "RESET_LINK_INVALID", message: "This reset link is invalid or expired." } });

    const saved = user.recoveryAnswers || [];
    if (saved.length === 2) {
      const provided = parseRecoveryAnswers(req.body?.recoveryAnswers);
      let matches = Boolean(provided);
      if (provided) {
        for (const stored of saved) {
          const candidate = provided.find((entry) => entry.questionId === stored.questionId);
          if (!candidate || !(await verifyRecoveryAnswer(candidate.answer, stored.answerHash))) matches = false;
        }
      }
      if (!matches) {
        challenge.attempts += 1;
        await challenge.save();
        return res.status(challenge.attempts >= 5 ? 429 : 400).json({ error: { code: challenge.attempts >= 5 ? "RECOVERY_LOCKED" : "RECOVERY_ANSWERS_INVALID", message: challenge.attempts >= 5 ? "Too many incorrect attempts. Try again after 30 minutes." : "The recovery answers did not match." } });
      }
    } else {
      const newAnswers = parseRecoveryAnswers(req.body?.newRecoveryAnswers);
      if (!newAnswers) return res.status(400).json({ error: { code: "RECOVERY_SETUP_REQUIRED", message: "Choose two different recovery questions and provide both answers." } });
      const recoveryHashes = [];
      for (const { questionId, answer } of newAnswers) recoveryHashes.push({ questionId, answerHash: await hashRecoveryAnswer(answer) });
      user.recoveryAnswers = recoveryHashes;
    }

    user.passwordHash = await hashPassword(password);
    await user.save();
    await PasswordResetChallenge.deleteOne({ _id: challenge._id });
    await RefreshSession.deleteMany({ userId: user.id });
    return res.json({ message: "Password updated. Please sign in with your new password." });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[refreshCookie];
    if (!rawToken) return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Please sign in again." } });
    const stored = await RefreshSession.findOneAndDelete({ tokenHash: hashToken(rawToken), expiresAt: { $gt: new Date() } });
    if (!stored) {
      res.clearCookie(refreshCookie, cookieOptions);
      return res.status(401).json({ error: { code: "INVALID_SESSION", message: "Please sign in again." } });
    }
    const user = await User.findById(stored.userId);
    await stored.deleteOne();
    if (!user || !user.isActive) {
      res.clearCookie(refreshCookie, cookieOptions);
      return res.status(401).json({ error: { code: "INVALID_SESSION", message: "Please sign in again." } });
    }
    return res.json(await startSession(user, res));
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[refreshCookie];
    if (rawToken) await RefreshSession.deleteOne({ tokenHash: hashToken(rawToken) });
    res.clearCookie(refreshCookie, cookieOptions);
    return res.json({ message: "Signed out." });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("phone email displayName profileImage role permissions isActive");
    if (!user || !user.isActive) return res.status(401).json({ error: { code: "INVALID_SESSION", message: "Please sign in again." } });
    return res.json({ user: sessionUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.put("/profile/image", authenticate, async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.auth.sub).select("profileImagePublicId isActive");
    if (!currentUser || !currentUser.isActive) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    const image = await uploadCloudinaryImage({ ...req.body, folder: "royal-jewellers/profiles" });
    try {
      if (currentUser.profileImagePublicId) await deleteCloudinaryImages([currentUser.profileImagePublicId]);
    } catch (deleteError) {
      await deleteCloudinaryImages([image.publicId]).catch(() => {});
      throw deleteError;
    }
    const user = await User.findByIdAndUpdate(req.auth.sub, { profileImage: image.url, profileImagePublicId: image.publicId }, { new: true })
      .select("phone email displayName profileImage role permissions isActive");
    return res.json({ user: sessionUser(user) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return next(error);
  }
});

router.delete("/profile/image", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select("phone email displayName profileImage profileImagePublicId role permissions isActive");
    if (!user || !user.isActive) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Account not found." } });
    if (user.profileImagePublicId) await deleteCloudinaryImages([user.profileImagePublicId]);
    user.profileImage = "";
    user.profileImagePublicId = "";
    await user.save();
    return res.json({ user: sessionUser(user) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return next(error);
  }
});

export default router;

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const serverEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
const frontendEnvPath = path.resolve(path.dirname(serverEnvPath), "..", "frontend", ".env");
dotenv.config({ path: serverEnvPath });
dotenv.config({ path: frontendEnvPath });

const nodeEnv = process.env.NODE_ENV || "development";
const devAccessSecret = "royal-jewellers-local-access-secret-change-before-deployment";
const accessSecret = process.env.JWT_ACCESS_SECRET || (nodeEnv === "production" ? "" : devAccessSecret);

if (nodeEnv === "production" && (!accessSecret || accessSecret.length < 32)) {
  throw new Error("Set JWT_ACCESS_SECRET to a strong value before production.");
}
if (process.env.JWT_ACCESS_SECRET && process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error("Configured JWT_ACCESS_SECRET values must be at least 32 characters.");
}

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/royal_jawellars",
  accessSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 30),
  emailMode: process.env.EMAIL_MODE || (nodeEnv === "production" ? "disabled" : "console"),
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "MH JEWELLERS <onboarding@resend.dev>",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

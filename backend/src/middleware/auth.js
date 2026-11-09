import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Please sign in to continue." } });

  try {
    req.auth = jwt.verify(token, config.accessSecret, { issuer: "royal-jewellers-api" });
    return next();
  } catch {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Your session has expired. Please sign in again." } });
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.auth;
    if (!user || !["admin", "employee"].includes(user.role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have access to this action." } });
    }
    if (user.role === "admin") return next();
    if (!user.permissions?.includes("*") && !user.permissions?.includes(permission)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have permission for this action." } });
    }
    return next();
  };
}

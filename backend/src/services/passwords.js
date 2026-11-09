import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const parameters = { N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

function normalizeAnswer(answer) {
  return answer.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64, parameters);
  return "scrypt$" + salt + "$" + Buffer.from(hash).toString("hex");
}

export async function verifyPassword(password, encoded) {
  if (typeof encoded !== "string") return false;
  const [scheme, salt, expectedHex] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(expectedHex || "")) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length, parameters));
  return timingSafeEqual(actual, expected);
}

export async function hashRecoveryAnswer(answer) {
  const normalized = normalizeAnswer(answer);
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(normalized, salt, 64, parameters);
  return "scrypt$" + salt + "$" + Buffer.from(hash).toString("hex");
}

export async function verifyRecoveryAnswer(answer, encoded) {
  return verifyPassword(normalizeAnswer(answer), encoded);
}

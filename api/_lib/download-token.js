const crypto = require("crypto");

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

function signDownloadToken(orderId, secret, ttlSeconds = DEFAULT_TTL_SECONDS, nowSeconds) {
  if (!orderId || !secret) return "";
  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyDownloadToken(token, secret, nowSeconds) {
  if (!token || !secret) return null;
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  const [orderId, expRaw, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(orderId)) return null;
  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isInteger(exp)) return null;
  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  if (exp < now) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}.${exp}`).digest("hex");
  if (expected.length !== sig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  return { orderId, exp };
}

module.exports = {
  DEFAULT_TTL_SECONDS,
  signDownloadToken,
  verifyDownloadToken,
};

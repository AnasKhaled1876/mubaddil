function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body || "{}"));
    } catch {
      return Promise.resolve(null);
    }
  }
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

function clientIp(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

const checkoutHits = new Map();

function allowCheckout(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 8;
  const entry = checkoutHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    checkoutHits.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  checkoutHits.set(ip, entry);
  return true;
}

function resetRateLimit() {
  checkoutHits.clear();
}

module.exports = {
  sendJson,
  readJsonBody,
  clientIp,
  allowCheckout,
  resetRateLimit,
};

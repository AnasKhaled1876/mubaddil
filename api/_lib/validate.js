const ORDER_ID_PATTERN = /^mub-[0-9]+-[a-f0-9]+$/;

function trimText(value, max) {
  const text = String(value ?? "").trim();
  if (!text || text.length > max) return "";
  return text;
}

function normalizeEgyptPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11 && digits[1] === "1") {
    return `+20${digits.slice(1)}`;
  }
  if (digits.startsWith("1") && digits.length === 10) return `+20${digits}`;
  return "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function parseCheckoutInput(body) {
  const firstName = trimText(body?.firstName ?? body?.first_name, 40);
  const lastName = trimText(body?.lastName ?? body?.last_name, 40);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = normalizeEgyptPhone(body?.phone ?? body?.phone_number);

  const errors = [];
  if (!firstName) errors.push("firstName");
  if (!lastName) errors.push("lastName");
  if (!isEmail(email)) errors.push("email");
  if (!phone) errors.push("phone");

  return {
    ok: errors.length === 0,
    errors,
    customer: { firstName, lastName, email, phone },
  };
}

function isOrderId(value) {
  return ORDER_ID_PATTERN.test(String(value ?? ""));
}

function createOrderId(now, randomHex) {
  const stamp = now ?? Date.now();
  const suffix = randomHex || require("crypto").randomBytes(4).toString("hex");
  return `mub-${stamp}-${suffix}`;
}

function isTruthyFlag(value) {
  return value === true || value === "true";
}

function isFalsyFlag(value) {
  return value === false || value === "false";
}

module.exports = {
  ORDER_ID_PATTERN,
  normalizeEgyptPhone,
  isEmail,
  parseCheckoutInput,
  isOrderId,
  createOrderId,
  isTruthyFlag,
  isFalsyFlag,
};

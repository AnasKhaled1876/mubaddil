const crypto = require("crypto");

const TRANSACTION_HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

function readPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function hmacValue(value) {
  if (value === true || value === false) return value ? "true" : "false";
  if (value == null) return "";
  return String(value);
}

function concatenateTransactionHmac(obj) {
  return TRANSACTION_HMAC_FIELDS.map((field) => hmacValue(readPath(obj, field))).join("");
}

function computeTransactionHmac(obj, secret) {
  return crypto.createHmac("sha512", secret).update(concatenateTransactionHmac(obj)).digest("hex");
}

function verifyTransactionHmac(obj, receivedHmac, secret) {
  if (!obj || !secret || !receivedHmac) return false;
  const received = String(receivedHmac).toLowerCase();
  const computed = computeTransactionHmac(obj, secret).toLowerCase();
  if (computed.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(received));
  } catch {
    return false;
  }
}

module.exports = {
  TRANSACTION_HMAC_FIELDS,
  concatenateTransactionHmac,
  computeTransactionHmac,
  verifyTransactionHmac,
  hmacValue,
};

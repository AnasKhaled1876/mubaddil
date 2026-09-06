const { config } = require("./config");
const { markOrderPaid, rememberFailed } = require("./orders");
const { isTruthyFlag, isFalsyFlag, isOrderId } = require("./validate");

function merchantOrderIdFromTransaction(obj) {
  return String(
    obj?.order?.merchant_order_id ||
      obj?.merchant_order_id ||
      obj?.payment_key_claims?.extra?.merchant_order_id ||
      "",
  );
}

function evaluatePaidTransaction(obj, expected) {
  const amountCents = Number(obj?.amount_cents);
  const currency = String(obj?.currency || "").toUpperCase();
  const orderId = merchantOrderIdFromTransaction(obj);
  const success = isTruthyFlag(obj?.success);
  const pending = !isFalsyFlag(obj?.pending) && obj?.pending != null ? isTruthyFlag(obj.pending) : false;
  const voided = isTruthyFlag(obj?.is_voided);
  const refunded = isTruthyFlag(obj?.is_refunded);

  if (!isOrderId(orderId)) {
    return { ok: false, reason: "unknown_order", orderId, amountCents, currency };
  }
  if (amountCents !== expected.amountCents) {
    return { ok: false, reason: "amount_mismatch", orderId, amountCents, currency };
  }
  if (currency !== expected.currency) {
    return { ok: false, reason: "currency_mismatch", orderId, amountCents, currency };
  }
  if (voided || refunded) {
    return { ok: false, reason: "not_captured", orderId, amountCents, currency };
  }
  if (pending) {
    return { ok: false, reason: "pending", orderId, amountCents, currency };
  }
  if (!success) {
    return { ok: false, reason: "failed", orderId, amountCents, currency };
  }
  return { ok: true, reason: "paid", orderId, amountCents, currency };
}

function applyEvaluatedTransaction(obj, evaluation) {
  const transactionId = obj?.id;
  const paymobOrderId = obj?.order?.id ? String(obj.order.id) : "";
  if (evaluation.ok) {
    return markOrderPaid({
      orderId: evaluation.orderId,
      transactionId,
      amountCents: evaluation.amountCents,
      currency: evaluation.currency,
      paymobOrderId,
    });
  }
  if (evaluation.reason === "failed" && evaluation.orderId) {
    rememberFailed(evaluation.orderId, transactionId);
  }
  return { duplicate: false, order: null };
}

function expectedPayment() {
  const c = config();
  return { amountCents: c.amountCents, currency: c.currency };
}

module.exports = {
  merchantOrderIdFromTransaction,
  evaluatePaidTransaction,
  applyEvaluatedTransaction,
  expectedPayment,
};

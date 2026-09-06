const { config } = require("./_lib/config");
const { sendJson, readJsonBody } = require("./_lib/http");
const { verifyTransactionHmac } = require("./_lib/hmac");
const { applyEvaluatedTransaction, evaluatePaidTransaction, expectedPayment } = require("./_lib/payment-state");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const body = await readJsonBody(req);
  if (!body) {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  const obj = body.obj || body;
  const receivedHmac = String(req.query?.hmac || new URL(req.url, "http://localhost").searchParams.get("hmac") || "");
  const secret = config().hmacSecret;

  if (!verifyTransactionHmac(obj, receivedHmac, secret)) {
    console.error("paymob_webhook_hmac_rejected");
    sendJson(res, 401, { error: "Invalid HMAC" });
    return;
  }

  const evaluation = evaluatePaidTransaction(obj, expectedPayment());
  if (evaluation.ok) {
    applyEvaluatedTransaction(obj, evaluation);
    console.log("paymob_webhook_paid", {
      orderId: evaluation.orderId,
      transactionId: obj.id,
    });
    sendJson(res, 200, { received: true });
    return;
  }

  if (evaluation.reason === "failed") {
    applyEvaluatedTransaction(obj, evaluation);
    console.log("paymob_webhook_failed", {
      orderId: evaluation.orderId,
      transactionId: obj.id,
    });
  } else {
    console.log("paymob_webhook_ignored", {
      reason: evaluation.reason,
      orderId: evaluation.orderId,
      transactionId: obj.id,
    });
  }

  sendJson(res, 200, { received: true });
};

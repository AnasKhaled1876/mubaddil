const { config, isPaymobConfigured } = require("./_lib/config");
const { sendJson, readJsonBody, clientIp, allowCheckout } = require("./_lib/http");
const { parseCheckoutInput, createOrderId } = require("./_lib/validate");
const { createOrderRecord } = require("./_lib/orders");
const { createIntention } = require("./_lib/paymob");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!allowCheckout(clientIp(req))) {
    sendJson(res, 429, { error: "Too many checkout attempts. Please wait a minute." });
    return;
  }

  if (!isPaymobConfigured()) {
    sendJson(res, 503, { error: "Payment is not configured yet." });
    return;
  }

  const body = await readJsonBody(req);
  if (!body) {
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  const parsed = parseCheckoutInput(body);
  if (!parsed.ok) {
    sendJson(res, 400, { error: "Invalid checkout details", fields: parsed.errors });
    return;
  }

  const c = config();
  const orderId = createOrderId();
  createOrderRecord({
    id: orderId,
    amountCents: c.amountCents,
    currency: c.currency,
    email: parsed.customer.email,
  });

  try {
    const intention = await createIntention({
      amountCents: c.amountCents,
      currency: c.currency,
      orderId,
      customer: parsed.customer,
    });
    sendJson(res, 200, {
      orderId,
      checkoutUrl: intention.checkoutUrl,
      amountCents: c.amountCents,
      currency: c.currency,
    });
  } catch (error) {
    console.error("checkout_intention_failed", {
      orderId,
      status: error.status || 0,
    });
    sendJson(res, 502, { error: "We couldn't start checkout. Please try again." });
  }
};

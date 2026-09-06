const { config, formatPrice } = require("./_lib/config");
const { sendJson } = require("./_lib/http");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const c = config();
  sendJson(res, 200, {
    amountCents: c.amountCents,
    currency: c.currency,
    displayAr: formatPrice(c.amountCents, c.currency, "ar"),
    displayEn: formatPrice(c.amountCents, c.currency, "en"),
  });
};

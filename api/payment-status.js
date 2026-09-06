const { config } = require("./_lib/config");
const { sendJson } = require("./_lib/http");
const { isOrderId } = require("./_lib/validate");
const { getOrder } = require("./_lib/orders");
const { signDownloadToken } = require("./_lib/download-token");
const { inquireByMerchantOrderId } = require("./_lib/paymob");
const { applyEvaluatedTransaction, evaluatePaidTransaction, expectedPayment } = require("./_lib/payment-state");

function downloadFor(orderId) {
  const c = config();
  if (!c.downloadTokenSecret) return null;
  const token = signDownloadToken(orderId, c.downloadTokenSecret);
  return {
    token,
    url: `/files/Mubaddil-Setup.exe?token=${encodeURIComponent(token)}`,
    filename: "Mubaddil-Setup.exe",
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const orderId = String(url.searchParams.get("orderId") || url.searchParams.get("order") || "");
  if (!isOrderId(orderId)) {
    sendJson(res, 400, { error: "Unknown order" });
    return;
  }

  const local = getOrder(orderId);
  if (local?.status === "paid") {
    sendJson(res, 200, {
      orderId,
      status: "paid",
      download: downloadFor(orderId),
    });
    return;
  }

  try {
    const inquired = await inquireByMerchantOrderId(orderId);
    if (inquired) {
      const evaluation = evaluatePaidTransaction(
        {
          ...inquired,
          order: {
            ...(inquired.order || {}),
            merchant_order_id: inquired.order?.merchant_order_id || orderId,
          },
        },
        expectedPayment(),
      );
      if (evaluation.ok) {
        applyEvaluatedTransaction(
          {
            ...inquired,
            order: {
              ...(inquired.order || {}),
              merchant_order_id: orderId,
            },
          },
          evaluation,
        );
        sendJson(res, 200, {
          orderId,
          status: "paid",
          download: downloadFor(orderId),
        });
        return;
      }
      if (evaluation.reason === "failed") {
        applyEvaluatedTransaction(inquired, evaluation);
        sendJson(res, 200, { orderId, status: "failed", download: null });
        return;
      }
    }
  } catch (error) {
    console.error("payment_status_inquiry_failed", { orderId });
  }

  sendJson(res, 200, {
    orderId,
    status: local?.status || "pending",
    download: null,
  });
};

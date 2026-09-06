const { config } = require("./config");

const FETCH_TIMEOUT_MS = 15000;

async function fetchJson(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function checkoutUrl(clientSecret) {
  const c = config();
  const params = new URLSearchParams({
    publicKey: c.publicKey,
    clientSecret,
  });
  return `${c.checkoutBaseUrl}/?${params.toString()}`;
}

function intentionPayload({ amountCents, currency, orderId, customer, integrationId, appUrl }) {
  return {
    amount: amountCents,
    currency,
    payment_methods: [integrationId],
    items: [
      {
        name: "Mubaddil",
        amount: amountCents,
        quantity: 1,
        description: "Windows wrong-keyboard fixer",
      },
    ],
    billing_data: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone_number: customer.phone,
      apartment: "NA",
      floor: "NA",
      street: "NA",
      building: "NA",
      shipping_method: "NA",
      postal_code: "NA",
      city: "Cairo",
      state: "Cairo",
      country: "EGY",
    },
    extras: { merchant_order_id: orderId },
    special_reference: orderId,
    notification_url: `${appUrl}/api/paymob-webhook`,
    redirection_url: `${appUrl}/payment?order=${encodeURIComponent(orderId)}`,
  };
}

async function createIntention({ amountCents, currency, orderId, customer }) {
  const c = config();
  const payload = intentionPayload({
    amountCents,
    currency,
    orderId,
    customer,
    integrationId: c.cardIntegrationId,
    appUrl: c.appUrl,
  });

  const result = await fetchJson(`${c.baseUrl}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${c.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data?.client_secret) {
    const error = new Error("Paymob intention failed");
    error.status = result.status;
    error.detail = result.data;
    throw error;
  }

  return {
    id: result.data.id || "",
    clientSecret: result.data.client_secret,
    paymobOrderId: result.data.intention_order_id || result.data.order?.id || "",
    checkoutUrl: checkoutUrl(result.data.client_secret),
  };
}

async function getAuthToken() {
  const c = config();
  if (!c.apiKey) return "";
  const result = await fetchJson(`${c.baseUrl}/api/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: c.apiKey }),
  });
  return result.data?.token || "";
}

function readInquiryTransaction(data) {
  if (!data || typeof data !== "object") return null;
  if (data.success != null && data.amount_cents != null) return data;
  if (data.transaction && typeof data.transaction === "object") return data.transaction;
  return data;
}

async function inquireByMerchantOrderId(orderId) {
  const c = config();
  const token = await getAuthToken();
  if (!token) return null;

  const result = await fetchJson(`${c.baseUrl}/api/ecommerce/orders/transaction_inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token,
      merchant_order_id: orderId,
    }),
  });

  if (!result.ok) return null;
  return readInquiryTransaction(result.data);
}

module.exports = {
  checkoutUrl,
  intentionPayload,
  createIntention,
  getAuthToken,
  inquireByMerchantOrderId,
  readInquiryTransaction,
};

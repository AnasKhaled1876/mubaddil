function env(name, fallback = "") {
  const value = process.env[name];
  return value == null || value === "" ? fallback : value;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_AMOUNT_CENTS = 9900;
const DEFAULT_CURRENCY = "EGP";

function config() {
  const amountCents = parsePositiveInt(env("PAYMOB_AMOUNT_CENTS"), DEFAULT_AMOUNT_CENTS);
  const currency = env("PAYMOB_CURRENCY", DEFAULT_CURRENCY).toUpperCase();
  const baseUrl = env("PAYMOB_BASE_URL", "https://accept.paymob.com").replace(/\/$/, "");
  const checkoutBaseUrl = env("PAYMOB_CHECKOUT_URL", "https://eg.checkout.paymob.com").replace(
    /\/$/,
    "",
  );
  const appUrl = (
    env("APP_URL") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://bdil-chi.vercel.app")
  ).replace(/\/$/, "");

  return {
    amountCents,
    currency,
    baseUrl,
    checkoutBaseUrl,
    appUrl,
    secretKey: env("PAYMOB_SECRET_KEY"),
    publicKey: env("PAYMOB_PUBLIC_KEY"),
    apiKey: env("PAYMOB_API_KEY"),
    hmacSecret: env("PAYMOB_HMAC_SECRET"),
    cardIntegrationId: parsePositiveInt(env("PAYMOB_INTEGRATION_ID_CARD"), 0),
    downloadTokenSecret: env("DOWNLOAD_TOKEN_SECRET") || env("PAYMOB_HMAC_SECRET"),
  };
}

function isPaymobConfigured() {
  const c = config();
  return Boolean(c.secretKey && c.publicKey && c.hmacSecret && c.cardIntegrationId);
}

function formatPrice(amountCents, currency, lang) {
  const major = Math.round(Number(amountCents) / 100);
  if (currency === "EGP") {
    return lang === "ar" ? `${major} جنيه` : `${major} EGP`;
  }
  return `${major} ${currency}`;
}

module.exports = {
  DEFAULT_AMOUNT_CENTS,
  DEFAULT_CURRENCY,
  config,
  isPaymobConfigured,
  formatPrice,
  parsePositiveInt,
};

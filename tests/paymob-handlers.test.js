const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const hmac = require("../api/_lib/hmac");
const { resetOrderStore, getOrder } = require("../api/_lib/orders");
const { resetRateLimit } = require("../api/_lib/http");

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(body) {
      this.body = body || "";
    },
  };
  return res;
}

function jsonReq(method, url, body, query) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { "content-type": "application/json" };
  req.body = body;
  req.query = query || {};
  return req;
}

test("price endpoint returns the server amount, not a client value", () => {
  process.env.PAYMOB_AMOUNT_CENTS = "9900";
  process.env.PAYMOB_CURRENCY = "EGP";
  delete require.cache[require.resolve("../api/price")];
  const handler = require("../api/price");
  const res = mockRes();
  handler(jsonReq("GET", "/api/price"), res);
  const data = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(data.amountCents, 9900);
  assert.equal(data.currency, "EGP");
});

test("checkout rejects invalid input before calling Paymob", async () => {
  process.env.PAYMOB_SECRET_KEY = "sk_test";
  process.env.PAYMOB_PUBLIC_KEY = "pk_test";
  process.env.PAYMOB_HMAC_SECRET = "hmac";
  process.env.PAYMOB_INTEGRATION_ID_CARD = "123";
  resetRateLimit();
  delete require.cache[require.resolve("../api/checkout")];
  const handler = require("../api/checkout");
  const res = mockRes();
  await handler(
    jsonReq("POST", "/api/checkout", {
      firstName: "Anas",
      lastName: "Khaled",
      email: "bad",
      phone: "00",
      amount: 1,
    }),
    res,
  );
  assert.equal(res.statusCode, 400);
  const data = JSON.parse(res.body);
  assert.deepEqual(data.fields, ["email", "phone"]);
});

test("webhook with invalid HMAC does not mark the order paid", async () => {
  process.env.PAYMOB_HMAC_SECRET = "real-secret";
  process.env.PAYMOB_AMOUNT_CENTS = "9900";
  process.env.PAYMOB_CURRENCY = "EGP";
  resetOrderStore();
  delete require.cache[require.resolve("../api/paymob-webhook")];
  const handler = require("../api/paymob-webhook");
  const obj = {
    amount_cents: 9900,
    created_at: "2024-06-13T11:33:44.592345",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: 99,
    integration_id: 1,
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 2, merchant_order_id: "mub-1-abcd1234" },
    owner: 1,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    success: true,
  };
  const res = mockRes();
  await handler(jsonReq("POST", "/api/paymob-webhook?hmac=deadbeef", { obj }, { hmac: "deadbeef" }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(getOrder("mub-1-abcd1234"), null);
});

test("webhook with valid HMAC and matching amount marks paid once", async () => {
  process.env.PAYMOB_HMAC_SECRET = "real-secret";
  process.env.PAYMOB_AMOUNT_CENTS = "9900";
  process.env.PAYMOB_CURRENCY = "EGP";
  resetOrderStore();
  delete require.cache[require.resolve("../api/paymob-webhook")];
  const handler = require("../api/paymob-webhook");
  const obj = {
    amount_cents: 9900,
    created_at: "2024-06-13T11:33:44.592345",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: 100,
    integration_id: 1,
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 3, merchant_order_id: "mub-1-abcd1234" },
    owner: 1,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    success: true,
  };
  const signature = hmac.computeTransactionHmac(obj, "real-secret");
  const first = mockRes();
  await handler(jsonReq("POST", `/api/paymob-webhook?hmac=${signature}`, { obj }, { hmac: signature }), first);
  const second = mockRes();
  await handler(jsonReq("POST", `/api/paymob-webhook?hmac=${signature}`, { obj }, { hmac: signature }), second);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(getOrder("mub-1-abcd1234").status, "paid");
});

test("webhook with valid HMAC and wrong amount stays unpaid", async () => {
  process.env.PAYMOB_HMAC_SECRET = "real-secret";
  process.env.PAYMOB_AMOUNT_CENTS = "9900";
  process.env.PAYMOB_CURRENCY = "EGP";
  resetOrderStore();
  delete require.cache[require.resolve("../api/paymob-webhook")];
  const handler = require("../api/paymob-webhook");
  const obj = {
    amount_cents: 100,
    created_at: "2024-06-13T11:33:44.592345",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: 101,
    integration_id: 1,
    is_3d_secure: false,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 4, merchant_order_id: "mub-1-abcd1234" },
    owner: 1,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    success: true,
  };
  const signature = hmac.computeTransactionHmac(obj, "real-secret");
  const res = mockRes();
  await handler(jsonReq("POST", `/api/paymob-webhook?hmac=${signature}`, { obj }, { hmac: signature }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(getOrder("mub-1-abcd1234"), null);
});

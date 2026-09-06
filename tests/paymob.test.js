const test = require("node:test");
const assert = require("node:assert/strict");

const { concatenateTransactionHmac, computeTransactionHmac, verifyTransactionHmac } = require("../api/_lib/hmac");
const { signDownloadToken, verifyDownloadToken } = require("../api/_lib/download-token");
const { parseCheckoutInput, normalizeEgyptPhone, createOrderId, isOrderId } = require("../api/_lib/validate");
const { intentionPayload } = require("../api/_lib/paymob");
const { evaluatePaidTransaction, applyEvaluatedTransaction } = require("../api/_lib/payment-state");
const { resetOrderStore, getOrder } = require("../api/_lib/orders");

const LIVE_DOCS_CONCAT =
  "1000002024-06-13T11:33:44.592345EGPfalsefalse1920364654097558truefalsefalsefalsetruefalse217503754302852false2346MasterCardcardtrue";

const LIVE_DOCS_OBJ = {
  amount_cents: 100000,
  created_at: "2024-06-13T11:33:44.592345",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 192036465,
  integration_id: 4097558,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 21750375, merchant_order_id: "mub-1-abcd1234" },
  owner: 4302852,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};

const SKILL_CONCAT =
  "1002020-03-25T18:39:44.719228EGPfalsefalse25567066741truefalsefalsefalsetruefalse47782394705false2346MasterCardcardtrue";

const SKILL_OBJ = {
  amount_cents: 100,
  created_at: "2020-03-25T18:39:44.719228",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 2556706,
  integration_id: 6741,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 4778239, merchant_order_id: "mub-1-abcd1234" },
  owner: 4705,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};

test("HMAC concatenation matches live Paymob docs", () => {
  assert.equal(concatenateTransactionHmac(LIVE_DOCS_OBJ), LIVE_DOCS_CONCAT);
});

test("HMAC concatenation matches Paymob skill example", () => {
  assert.equal(concatenateTransactionHmac(SKILL_OBJ), SKILL_CONCAT);
});

test("HMAC verification accepts a matching SHA-512 signature", () => {
  const secret = "test-hmac-secret";
  const hmac = computeTransactionHmac(LIVE_DOCS_OBJ, secret);
  assert.equal(verifyTransactionHmac(LIVE_DOCS_OBJ, hmac, secret), true);
});

test("HMAC verification rejects a tampered payload", () => {
  const secret = "test-hmac-secret";
  const hmac = computeTransactionHmac(LIVE_DOCS_OBJ, secret);
  const tampered = { ...LIVE_DOCS_OBJ, amount_cents: 1 };
  assert.equal(verifyTransactionHmac(tampered, hmac, secret), false);
});

test("download tokens expire and reject bad signatures", () => {
  const secret = "download-secret";
  const now = 1_700_000_000;
  const token = signDownloadToken("mub-1-abcd1234", secret, 60, now);
  assert.deepEqual(verifyDownloadToken(token, secret, now + 10), {
    orderId: "mub-1-abcd1234",
    exp: now + 60,
  });
  assert.equal(verifyDownloadToken(token, secret, now + 61), null);
  const broken = token.slice(0, -2) + "ff";
  assert.equal(verifyDownloadToken(broken, secret, now + 10), null);
});

test("checkout input ignores a client-supplied amount", () => {
  const parsed = parseCheckoutInput({
    firstName: "Anas",
    lastName: "Khaled",
    email: "anas@example.com",
    phone: "01012345678",
    amount: 1,
    amountCents: 100,
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.customer.phone, "+201012345678");
  assert.equal("amount" in parsed.customer, false);
});

test("checkout input rejects a bad phone or email", () => {
  const parsed = parseCheckoutInput({
    firstName: "Anas",
    lastName: "Khaled",
    email: "not-an-email",
    phone: "123",
  });
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.errors, ["email", "phone"]);
});

test("Egypt phone normalization", () => {
  assert.equal(normalizeEgyptPhone("+201012345678"), "+201012345678");
  assert.equal(normalizeEgyptPhone("01012345678"), "+201012345678");
  assert.equal(normalizeEgyptPhone("1012345678"), "+201012345678");
  assert.equal(normalizeEgyptPhone("02-123"), "");
});

test("intention payload uses the server amount and special_reference", () => {
  const payload = intentionPayload({
    amountCents: 9900,
    currency: "EGP",
    orderId: "mub-1-abcd1234",
    customer: {
      firstName: "Anas",
      lastName: "Khaled",
      email: "anas@example.com",
      phone: "+201012345678",
    },
    integrationId: 123456,
    appUrl: "https://bdil-chi.vercel.app",
  });
  assert.equal(payload.amount, 9900);
  assert.equal(payload.items[0].amount, 9900);
  assert.equal(payload.special_reference, "mub-1-abcd1234");
  assert.equal(payload.billing_data.phone_number, "+201012345678");
  assert.match(payload.notification_url, /\/api\/paymob-webhook$/);
  assert.match(payload.redirection_url, /\/payment\?order=mub-1-abcd1234$/);
});

test("paid evaluation requires matching amount, currency, and success", () => {
  const expected = { amountCents: 9900, currency: "EGP" };
  const paid = {
    ...LIVE_DOCS_OBJ,
    amount_cents: 9900,
    success: true,
    pending: false,
    order: { id: 1, merchant_order_id: "mub-1-abcd1234" },
  };
  assert.equal(evaluatePaidTransaction(paid, expected).ok, true);

  assert.equal(evaluatePaidTransaction({ ...paid, amount_cents: 100 }, expected).reason, "amount_mismatch");
  assert.equal(evaluatePaidTransaction({ ...paid, currency: "USD" }, expected).reason, "currency_mismatch");
  assert.equal(evaluatePaidTransaction({ ...paid, success: false }, expected).reason, "failed");
  assert.equal(evaluatePaidTransaction({ ...paid, pending: true }, expected).reason, "pending");
});

test("webhook fulfillment is idempotent for the same transaction", () => {
  resetOrderStore();
  const expected = { amountCents: 9900, currency: "EGP" };
  const obj = {
    ...LIVE_DOCS_OBJ,
    id: 88,
    amount_cents: 9900,
    order: { id: 9, merchant_order_id: "mub-1-abcd1234" },
  };
  const evaluation = evaluatePaidTransaction(obj, expected);
  const first = applyEvaluatedTransaction(obj, evaluation);
  const second = applyEvaluatedTransaction(obj, evaluation);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(getOrder("mub-1-abcd1234").status, "paid");
});

test("order ids are stable and strict", () => {
  const id = createOrderId(1700000000000, "deadbeef");
  assert.equal(id, "mub-1700000000000-deadbeef");
  assert.equal(isOrderId(id), true);
  assert.equal(isOrderId("order-1"), false);
});

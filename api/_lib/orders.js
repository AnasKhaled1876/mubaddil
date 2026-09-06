const store = {
  orders: new Map(),
  transactions: new Set(),
};

function resetOrderStore() {
  store.orders.clear();
  store.transactions.clear();
}

function createOrderRecord(input) {
  const order = {
    id: input.id,
    status: "pending",
    amountCents: input.amountCents,
    currency: input.currency,
    email: input.email || "",
    createdAt: Date.now(),
    intentionId: input.intentionId || "",
    paymobOrderId: input.paymobOrderId || "",
    transactionId: "",
    paidAt: 0,
  };
  store.orders.set(order.id, order);
  return order;
}

function getOrder(orderId) {
  return store.orders.get(orderId) || null;
}

function rememberFailed(orderId, transactionId) {
  const order = store.orders.get(orderId);
  if (order && order.status !== "paid") {
    order.status = "failed";
  }
  if (transactionId) store.transactions.add(String(transactionId));
  return order || null;
}

function markOrderPaid({ orderId, transactionId, amountCents, currency, paymobOrderId }) {
  const txnKey = String(transactionId || "");
  if (txnKey && store.transactions.has(txnKey)) {
    const existing = store.orders.get(orderId);
    return { duplicate: true, order: existing || null };
  }
  if (txnKey) store.transactions.add(txnKey);

  const existing = store.orders.get(orderId);
  if (existing && existing.status === "paid") {
    return { duplicate: true, order: existing };
  }

  const order = existing || {
    id: orderId,
    email: "",
    createdAt: Date.now(),
    intentionId: "",
  };
  order.status = "paid";
  order.amountCents = amountCents;
  order.currency = currency;
  order.transactionId = txnKey;
  order.paymobOrderId = paymobOrderId || order.paymobOrderId || "";
  order.paidAt = Date.now();
  store.orders.set(orderId, order);
  return { duplicate: false, order };
}

module.exports = {
  resetOrderStore,
  createOrderRecord,
  getOrder,
  rememberFailed,
  markOrderPaid,
};

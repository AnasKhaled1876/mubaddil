export interface CheckoutDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
}

export async function startCheckout(details: CheckoutDetails): Promise<CheckoutResult> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(details),
  });
  const data = (await response.json().catch(() => ({}))) as {
    orderId?: string;
    checkoutUrl?: string;
    error?: string;
  };
  if (!response.ok || !data.checkoutUrl || !data.orderId) {
    throw new Error(data.error || 'checkout_failed');
  }
  return { orderId: data.orderId, checkoutUrl: data.checkoutUrl };
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentStatusResult {
  orderId: string;
  status: PaymentStatus;
  download: { url: string; filename: string } | null;
}

export async function fetchPaymentStatus(orderId: string): Promise<PaymentStatusResult> {
  const response = await fetch(`/api/payment-status?orderId=${encodeURIComponent(orderId)}`, {
    headers: { Accept: 'application/json' },
  });
  const data = (await response.json().catch(() => ({}))) as PaymentStatusResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'status_failed');
  }
  return {
    orderId: data.orderId,
    status: data.status,
    download: data.download || null,
  };
}

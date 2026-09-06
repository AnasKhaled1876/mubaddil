import { Language } from '../types';

export const FALLBACK_AMOUNT_CENTS = 9900;
export const FALLBACK_CURRENCY = 'EGP';
export const SETUP_NAME = 'Mubaddil-Setup.exe';

export function formatPrice(amountCents: number, currency: string, lang: Language): string {
  const major = Math.round(amountCents / 100);
  if (currency === 'EGP') {
    return lang === 'ar' ? `${major} جنيه` : `${major} EGP`;
  }
  return `${major} ${currency}`;
}

export interface ProductPrice {
  amountCents: number;
  currency: string;
  display: string;
}

export async function fetchProductPrice(lang: Language): Promise<ProductPrice> {
  try {
    const response = await fetch('/api/price', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('price_unavailable');
    const data = (await response.json()) as {
      amountCents?: number;
      currency?: string;
      displayAr?: string;
      displayEn?: string;
    };
    const amountCents = Number(data.amountCents) || FALLBACK_AMOUNT_CENTS;
    const currency = data.currency || FALLBACK_CURRENCY;
    return {
      amountCents,
      currency,
      display: lang === 'ar' ? data.displayAr || formatPrice(amountCents, currency, lang) : data.displayEn || formatPrice(amountCents, currency, lang),
    };
  } catch {
    return {
      amountCents: FALLBACK_AMOUNT_CENTS,
      currency: FALLBACK_CURRENCY,
      display: formatPrice(FALLBACK_AMOUNT_CENTS, FALLBACK_CURRENCY, lang),
    };
  }
}

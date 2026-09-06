import React, { useState } from 'react';
import { CreditCard, LoaderCircle } from 'lucide-react';
import { Language } from '../types';
import { startCheckout } from '../lib/checkout';

interface CheckoutFormProps {
  lang: Language;
  priceLabel: string;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ lang, priceLabel }) => {
  const isAr = lang === 'ar';
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onChange = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await startCheckout(form);
      window.location.href = result.checkoutUrl;
    } catch {
      setError(
        isAr
          ? 'ما قدرناش نفتح الدفع دلوقتي. حاول مرة تانية.'
          : "We couldn't start checkout. Please try again.",
      );
      setBusy(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20';

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto text-left rtl:text-right">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
            {isAr ? 'الاسم الأول' : 'First name'}
          </span>
          <input
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={onChange('firstName')}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
            {isAr ? 'اسم العائلة' : 'Last name'}
          </span>
          <input
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={onChange('lastName')}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block mb-3">
        <span className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
          {isAr ? 'الإيميل' : 'Email'}
        </span>
        <input
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange('email')}
          className={fieldClass}
        />
      </label>

      <label className="block mb-4">
        <span className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
          {isAr ? 'الموبايل' : 'Mobile number'}
        </span>
        <input
          required
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder={isAr ? '01xxxxxxxxx' : '01xxxxxxxxx'}
          value={form.phone}
          onChange={onChange('phone')}
          className={fieldClass}
          dir="ltr"
        />
      </label>

      <button
        id="main-checkout-button"
        type="submit"
        disabled={busy}
        className="w-full group p-4 sm:p-5 rounded-2xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-base sm:text-lg flex items-center justify-between shadow-lg shadow-[#166534]/30 hover:shadow-xl hover:shadow-[#166534]/40 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            {busy ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-white font-bold text-base sm:text-lg leading-snug">
              {busy ? (isAr ? 'بنفتح الدفع...' : 'Opening checkout...') : isAr ? 'ادفع وحمّل' : 'Pay & download'}
            </div>
            <div className="text-emerald-100/80 text-xs font-normal">
              {isAr ? 'ويندوز 10 و 11 • 14 ميجا' : 'Windows 10 & 11 • 14 MB'}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-lg bg-white/20 text-xs font-semibold text-white">
          {priceLabel}
        </div>
      </button>

      {error && (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 text-center">{error}</p>
      )}
    </form>
  );
};

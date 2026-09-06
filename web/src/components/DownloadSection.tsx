import React, { useEffect, useState } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { CheckoutForm } from './CheckoutForm';
import { FALLBACK_AMOUNT_CENTS, FALLBACK_CURRENCY, fetchProductPrice, formatPrice } from '../data/price';

interface DownloadSectionProps {
  lang: Language;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [priceLabel, setPriceLabel] = useState(
    formatPrice(FALLBACK_AMOUNT_CENTS, FALLBACK_CURRENCY, lang),
  );

  useEffect(() => {
    let cancelled = false;
    void fetchProductPrice(lang).then((price) => {
      if (!cancelled) setPriceLabel(price.display);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <section id="download" className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-8 sm:p-12 bg-white dark:bg-[#161817] border-2 border-emerald-600/20 dark:border-emerald-800/40 shadow-xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-300 mb-6 border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? `دفعة واحدة • ${priceLabel}` : `One-time purchase • ${priceLabel}`}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-4 leading-tight">
            {isAr ? 'ادفع مرة. دبل كليك. خلصت.' : 'Pay once. Double click. Done.'}
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {isAr
              ? 'بعد الدفع بيتفتح التحميل على طول. ملف واحد خفيف، من غير اشتراك، ومن غير صلاحيات مسؤول.'
              : 'The installer unlocks after payment. One lightweight file, no subscription, no admin privileges.'}
          </p>

          <div className="mb-8">
            <CheckoutForm lang={lang} priceLabel={priceLabel} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-left rtl:text-right">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? '١' : '1'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'ادفع' : 'Pay'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? `${priceLabel} مرة واحدة.` : `${priceLabel} once.`}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? '٢' : '2'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'حمّل بعد التأكيد' : 'Download after confirmation'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'الملف بيتفتح بعد ما الدفع يتأكد.' : 'The file unlocks after payment is confirmed.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? '٣' : '3'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'دبل كليك وخلصت' : 'Double click & done'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'بيشتغل جنب الساعة.' : 'It sits by the clock.'}
              </p>
            </div>
          </div>

          <div className="mt-8 text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <span>{isAr ? 'الكود مفتوح على' : 'Source is on'}</span>
            <a
              href="https://github.com/AnasKhaled1876/mubaddil"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#1f6b4a] dark:hover:text-emerald-400 underline inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

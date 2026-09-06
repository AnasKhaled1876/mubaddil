import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, LoaderCircle, XCircle } from 'lucide-react';
import { Language, Theme } from '../types';
import { Navbar } from './Navbar';
import { fetchPaymentStatus, PaymentStatus } from '../lib/checkout';
import { SETUP_NAME } from '../data/price';

interface PaymentPageProps {
  lang: Language;
  theme: Theme;
  onToggleLang: () => void;
  onToggleTheme: () => void;
}

function readOrderId(): string {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('order') ||
    params.get('merchant_order_id') ||
    params.get('merchantOrderId') ||
    ''
  );
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
}) => {
  const isAr = lang === 'ar';
  const [status, setStatus] = useState<PaymentStatus | 'checking'>('checking');
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    const orderId = readOrderId();
    if (!orderId) {
      setStatus('failed');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      try {
        const result = await fetchPaymentStatus(orderId);
        if (cancelled) return;
        if (result.status === 'paid') {
          setDownloadUrl(result.download?.url || '');
          setStatus('paid');
          return;
        }
        if (result.status === 'failed') {
          setStatus('failed');
          return;
        }
      } catch {
        if (cancelled) return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        setStatus('pending');
        return;
      }
      window.setTimeout(() => {
        void poll();
      }, 2000);
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] dark:bg-[#111312] text-neutral-900 dark:text-neutral-100">
      <Navbar
        lang={lang}
        onToggleLang={onToggleLang}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onDownloadClick={() => {
          window.location.href = '/#download';
        }}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#161817] border border-neutral-200 dark:border-neutral-800 shadow-xl p-8 text-center">
          {(status === 'checking' || status === 'pending') && (
            <>
              <LoaderCircle className="w-10 h-10 mx-auto mb-4 text-[#166534] animate-spin" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? 'بنأكد الدفع...' : 'Confirming your payment...'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {isAr
                  ? 'استنى لحظة. التحميل يظهر بعد ما الدفع يتأكد.'
                  : 'Please wait. The download appears after payment is confirmed.'}
              </p>
            </>
          )}

          {status === 'paid' && (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-[#166534]" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? 'تم الدفع. حمّل البرنامج.' : 'Payment confirmed. Download the app.'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                {isAr
                  ? 'دبل كليك على الملف، Next، وخلصت.'
                  : 'Double-click the file, hit Next, and you are done.'}
              </p>
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold"
                >
                  <Download className="w-5 h-5" />
                  <span>{isAr ? `تحميل ${SETUP_NAME}` : `Download ${SETUP_NAME}`}</span>
                </a>
              ) : (
                <p className="text-sm text-rose-600">
                  {isAr ? 'الدفع تم، بس رابط التحميل مش جاهز. راجع الصفحة كمان شوية.' : 'Payment is confirmed, but the download link is not ready yet. Refresh in a moment.'}
                </p>
              )}
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-10 h-10 mx-auto mb-4 text-rose-500" />
              <h1 className="text-2xl font-bold mb-2">
                {isAr ? 'ما اكتملش الدفع' : "Payment didn't complete"}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                {isAr
                  ? 'جرّب مرة تانية من صفحة الشراء. مفيش تحميل من غير دفع مؤكد.'
                  : 'Try again from the purchase page. The installer stays locked until payment is confirmed.'}
              </p>
              <a
                href="/#download"
                className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold"
              >
                {isAr ? 'ارجع للدفع' : 'Back to checkout'}
              </a>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

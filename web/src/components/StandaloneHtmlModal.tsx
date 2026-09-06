import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Download } from 'lucide-react';
import { Language } from '../types';

interface StandaloneHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const StandaloneHtmlModal: React.FC<StandaloneHtmlModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState<boolean>(false);

  const sampleHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مبدّل | Mubaddil — حل مشكلة الكيبورد الغلط في ويندوز</title>
  <meta name="description" content="تطبيق ويندوز في شريط المهام يصحح الكلمات المكتوبة بالكيبورد الغلط ويبدل لغة الإدخال تلقائياً في لمح البصر.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #fafaf8; }
  </style>
</head>
<body class="text-neutral-900 antialiased selection:bg-[#166534]/20 selection:text-[#166534]">
  <!-- Header -->
  <header class="border-b border-black/[0.06] bg-[#fafaf8]/90 backdrop-blur sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-lg">مـ</div>
        <span class="font-bold text-lg">مبدّل <span class="text-xs px-2 py-0.5 bg-emerald-100 text-[#166534] rounded-md mr-2 font-semibold">دفعة واحدة</span></span>
      </div>
      <a href="#download" class="px-4 py-2 text-sm font-semibold rounded-lg bg-[#166534] text-white hover:bg-[#14532d] transition-colors">تحميل البرنامج</a>
    </div>
  </header>

  <!-- Hero -->
  <section class="py-20 text-center px-4">
    <div class="max-w-3xl mx-auto">
      <span class="px-3 py-1 rounded-full border border-emerald-600/20 bg-emerald-50 text-[#166534] text-xs font-semibold">تطبيق لويندوز 10 و 11</span>
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mt-6 mb-4">كتبت عربي وطلع إنجليزي؟ <br><span class="text-[#166534]">مبدّل بيصلحه أول ما تدوس مسافة.</span></h1>
      <p class="text-base sm:text-lg text-neutral-600 mb-8 max-w-lg mx-auto leading-relaxed">بدون مسح وبدون Alt+Shift.. كمل كتابتك عادي ومبدّل هيقلب اللغة لوحده.</p>
      <a href="#download" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#166534] text-white font-bold text-base shadow-lg hover:bg-[#14532d]">ادفع وحمّل لويندوز</a>
    </div>
  </section>

  <!-- Download Section -->
  <section id="download" class="py-16 px-4 max-w-2xl mx-auto text-center">
    <div class="p-8 rounded-3xl bg-white border-2 border-emerald-600/20 shadow-xl">
      <h2 class="text-3xl font-extrabold mb-3">حمّل. دبل كليك. خلصت.</h2>
      <p class="text-neutral-600 mb-6 text-sm">ملف واحد خفيف، يشتغل في شريط المهام في صمت بدون إعلانات أو نوافذ منبثقة.</p>
      <a href="#download" class="block w-full p-4 rounded-xl bg-[#166534] text-white font-bold hover:bg-[#14532d]">ادفع 99 جنيه وحمّل Mubaddil-Setup.exe</a>
    </div>
  </section>
</body>
</html>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#181a19] rounded-2xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#1f6b4a] dark:text-emerald-400" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              {isAr ? 'كود HTML للصفحة (بدون باك إند)' : 'Clean HTML Code (Zero Backend)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
            {isAr
              ? 'بناءً على طلبك («give me html pages only with no backend»), هذا كود HTML خالص يمكنك نسخه مباشرة واستخدامه في أي استضافة ستاتيك أو في مجلد demo/.'
              : 'As requested ("give me html pages only with no backend"), here is a clean, self-contained HTML page ready to drop into any static hosting or the demo/ folder.'}
          </p>

          <pre className="p-4 rounded-xl bg-neutral-900 text-neutral-200 text-xs font-mono overflow-x-auto text-left leading-relaxed">
            <code>{sampleHtml}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <span className="text-xs text-neutral-500">
            {isAr ? 'ملف HTML ستاتيك خفيف' : 'Static standalone HTML'}
          </span>
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-4 py-2 rounded-lg bg-[#1f6b4a] hover:bg-[#18553a] text-white font-medium text-xs flex items-center gap-1.5 transition-all active:scale-98"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كود HTML' : 'Copy HTML')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

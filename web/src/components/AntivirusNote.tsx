import React, { useState } from 'react';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import { Language } from '../types';
import { SETUP_NAME } from '../data/download';

interface AntivirusNoteProps {
  lang: Language;
}

export const AntivirusNote: React.FC<AntivirusNoteProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);

  return (
    <div
      id="antivirus"
      className="mt-6 text-left rtl:text-right rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-start gap-3"
      >
        <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {isAr
              ? 'كاسبرسكي أو ويندوز مسح الملف؟ ده طبيعي.'
              : 'Kaspersky or Windows deleted the file? That is normal.'}
          </div>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            {isAr
              ? 'الملف مش موقع بشهادة مدفوعة لسه، فالبرامج الجديدة بتتعلم عليه. متطفّيش الحماية. رجّع الملف واسمح له أنت.'
              : 'The setup is not code-signed yet, so new apps get flagged. Do not turn protection off. Restore the file and allow it yourself.'}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-amber-200/60 dark:border-amber-900/40">
            <div className="font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
              {isAr ? 'كاسبرسكي' : 'Kaspersky'}
            </div>
            <ol className="list-decimal ps-4 space-y-1.5">
              <li>
                {isAr
                  ? 'افتح كاسبرسكي ← التقارير أو الحجر الصحي (Quarantine).'
                  : 'Open Kaspersky → Reports or Quarantine.'}
              </li>
              <li>
                {isAr
                  ? `لاقي ${SETUP_NAME} ← استعادة / Restore.`
                  : `Find ${SETUP_NAME} → Restore.`}
              </li>
              <li>
                {isAr
                  ? 'الإعدادات ← التهديدات والاستثناءات ← استثناءات ← أضف الملف، وبعد التثبيت أضف مجلد مبدّل.'
                  : 'Settings → Threats and exclusions → Exclusions → add the file, then after install add the Mubaddil folder.'}
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/60 border border-amber-200/60 dark:border-amber-900/40">
            <div className="font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
              {isAr ? 'ويندوز SmartScreen' : 'Windows SmartScreen'}
            </div>
            <p>
              {isAr
                ? 'لو ظهرت «Windows protected your PC»: More info ← Run anyway.'
                : 'If you see “Windows protected your PC”: More info → Run anyway.'}
            </p>
          </div>

          <p className="text-neutral-500 dark:text-neutral-400">
            {isAr
              ? 'مبدّل أوفلاين ومش بيطلب صلاحيات مدير. الاستثناء من عندك أنت، مش من جوا البرنامج.'
              : 'Mubaddil is offline and does not need admin rights. The exception is yours to add — the app never turns antivirus off.'}
          </p>
        </div>
      )}
    </div>
  );
};

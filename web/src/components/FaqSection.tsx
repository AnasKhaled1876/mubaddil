import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Language } from '../types';
import { faqs } from '../data/content';

interface FaqSectionProps {
  lang: Language;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-neutral-50/50 dark:bg-[#141615] border-t border-neutral-200/70 dark:border-neutral-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#1f6b4a] dark:text-emerald-400" />
            <span>{isAr ? 'إجابات واضحة وبسيطة' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-3">
            {isAr ? 'الأسئلة الشائعة' : 'Common Questions'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isAr
              ? 'كل ما يهمك معرفته عن طريقة عمل البرنامج وأمان جهازك.'
              : 'Everything you need to know about how Mubaddil runs safely on your PC.'}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#191b1a] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left rtl:text-right flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-neutral-900 dark:text-white hover:text-[#1f6b4a] dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{isAr ? faq.questionAr : faq.questionEn}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#1f6b4a] dark:text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/70 pt-3">
                    {isAr ? faq.answerAr : faq.answerEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

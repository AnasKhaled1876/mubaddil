import React, { useState } from 'react';
import { Heart, Laptop, Code, Copy, Check, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
  onOpenHtmlModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenHtmlModal }) => {
  const isAr = lang === 'ar';

  return (
    <footer className="py-12 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121413] text-neutral-500 dark:text-neutral-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Attribution */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#166534] text-white flex items-center justify-center font-bold text-sm">
              مـ
            </div>
            <div>
              <div className="font-bold text-neutral-900 dark:text-white text-sm">
                {isAr ? 'مبدّل • Mubaddil' : 'Mubaddil'}
              </div>
              <div className="text-[11px] text-neutral-400">
                {isAr
                  ? 'حل مشكلة الكيبورد الغلط في ويندوز 10 و 11'
                  : 'The wrong-keyboard fix for Windows 10 & 11'}
              </div>
            </div>
          </div>

          {/* Quick Links & Static HTML Exporter */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={onOpenHtmlModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium transition-colors cursor-pointer"
              title={isAr ? 'عرض كود HTML النظيف للصفحة' : 'View clean standalone HTML'}
            >
              <Code className="w-3.5 h-3.5 text-[#166534] dark:text-emerald-400" />
              <span>{isAr ? 'كود HTML للصفحة' : 'Standalone HTML'}</span>
            </button>

            <a
              href="https://github.com/AnasKhaled1876/mubaddil"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://bdil-chi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Vercel Live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Copyright & local guarantee */}
          <div className="text-center md:text-left rtl:md:text-right text-[11px] text-neutral-400">
            <div>
              {isAr
                ? 'دفعة واحدة • 100% أوفلاين لحماية خصوصيتك'
                : 'One-time purchase • 100% Offline for your privacy'}
            </div>
            <div className="mt-0.5">
              © {new Date().getFullYear()} Mubaddil. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

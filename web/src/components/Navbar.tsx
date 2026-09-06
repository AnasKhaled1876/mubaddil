import React from 'react';
import { CreditCard, Globe, Moon, Sun } from 'lucide-react';
import { Language, Theme } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onDownloadClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onDownloadClick,
}) => {
  const isAr = lang === 'ar';

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#fafaf8]/85 dark:bg-[#121413]/85 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#166534] text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-[#166534]/20 group-hover:scale-105 transition-transform">
            <span>مـ</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
                {isAr ? 'مبدّل' : 'Mubaddil'}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-md">
                {isAr ? 'دفعة واحدة' : 'One-time'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-0.5">
              {isAr ? 'ويندوز 10 و 11' : 'Windows 10 & 11'}
            </span>
          </div>
        </a>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <a
            href="#demo"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {isAr ? 'المعاينة الحية' : 'Live Demo'}
          </a>
          <a
            href="#why"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {isAr ? 'ليه مبدّل؟' : 'Why Mubaddil'}
          </a>
          <a
            href="#tray"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {isAr ? 'شريط المهام' : 'Tray Menu'}
          </a>
          <a
            href="#faq"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
          </a>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            type="button"
            onClick={onToggleLang}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-all shadow-2xs"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            id="nav-download-btn"
            type="button"
            onClick={onDownloadClick}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#166534] hover:bg-[#14532d] text-white flex items-center gap-2 shadow-sm shadow-[#166534]/25 transition-all active:scale-98"
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isAr ? 'ادفع وحمّل' : 'Buy'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

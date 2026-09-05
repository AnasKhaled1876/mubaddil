import React, { useState } from 'react';
import { Download, CheckCircle2, Laptop, ShieldCheck, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface DownloadSectionProps {
  lang: Language;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    // Trigger simulated download prompt
    setTimeout(() => {
      // In production, direct link to releases or setup exe
      window.open('https://github.com/AnasKhaled1876/mubaddil/actions/workflows/msix.yml', '_blank');
    }, 1200);
  };

  return (
    <section id="download" className="py-16 md:py-24 relative overflow-hidden">
      {/* Subtle emerald radial background glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-8 sm:p-12 bg-white dark:bg-[#161817] border-2 border-emerald-600/20 dark:border-emerald-800/40 shadow-xl text-center relative overflow-hidden">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-300 mb-6 border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'مجاني 100% مدى الحياة' : '100% Free Forever'}</span>
          </div>

          {/* Catchphrase Title */}
          <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-4 leading-tight">
            {isAr ? 'حمّل. دبل كليك. خلصت.' : 'Download. Double click. Done.'}
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {isAr
              ? 'ملف واحد خفيف، بدون خطوات معقدة، وبدون ما يطلب صلاحيات مسؤول. نزل البرنامج وسيبه يشتغل في صمت.'
              : 'A single lightweight setup file. No complex steps, no admin privileges required. Install once, and it works silently.'}
          </p>

          {/* Direct Download Card Button */}
          <div className="max-w-md mx-auto mb-8">
            <button
              id="main-download-button"
              type="button"
              onClick={handleDownload}
              className="w-full group p-4 sm:p-5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-base sm:text-lg flex items-center justify-between shadow-lg shadow-[#166534]/30 hover:shadow-xl hover:shadow-[#166534]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5 text-left rtl:text-right">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-base sm:text-lg leading-snug">
                    {isAr ? 'تحميل Mubaddil-Setup.exe' : 'Download Mubaddil-Setup.exe'}
                  </div>
                  <div className="text-emerald-100/80 text-xs font-normal">
                    {isAr ? 'ويندوز 10 و 11 (64 بت) • الإصدار 1.2.0' : 'Windows 10 & 11 (64-bit) • v1.2.0'}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1 rounded-lg bg-white/20 text-xs font-semibold uppercase tracking-wider text-white">
                {isAr ? 'مجاني' : 'FREE'}
              </div>
            </button>

            {downloadStarted && (
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'جاري بدء التحميل.. شكراً لاستخدامك مبدّل!'
                    : 'Download initiating.. Thank you for using Mubaddil!'}
                </span>
              </div>
            )}
          </div>

          {/* 3 Step Simple Visual Instruction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-left rtl:text-right">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? 'الخطوة الأولى' : 'Step 1'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'حمّل ملف التثبيت' : 'Download Setup'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'ملف Mubaddil-Setup.exe بحجم 12 ميجا فقط.' : 'Lightweight 12MB single installer executable.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? 'الخطوة الثانية' : 'Step 2'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'دبل كليك و Next' : 'Double click & Next'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'تثبيت سريع بدون صلاحيات مدير (No Admin).' : 'Installs immediately without administrator rights.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-xs font-bold text-[#1f6b4a] dark:text-emerald-400 mb-1">
                {isAr ? 'الخطوة الثالثة' : 'Step 3'}
              </div>
              <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'انسى المشكلة خلاص' : 'Forget the problem'}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'بيشتغل في صمت تام في شريط المهام.' : 'Runs silently in your Windows system tray.'}
              </p>
            </div>
          </div>

          {/* GitHub link fallback for technical users if needed */}
          <div className="mt-8 text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1">
            <span>{isAr ? 'مفتوح المصدر على' : 'Open source on'}</span>
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

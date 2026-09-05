import React, { useState } from 'react';
import { Check, X, MousePointer, Volume2, Wifi, BatteryCharging, Power } from 'lucide-react';
import { Language } from '../types';

interface TrayPreviewProps {
  lang: Language;
}

export const TrayPreview: React.FC<TrayPreviewProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [isTrayActive, setIsTrayActive] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

  // Toggle app active state
  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrayActive(!isTrayActive);
  };

  return (
    <section id="tray" className="py-12 md:py-20 bg-neutral-100/70 dark:bg-[#131514] border-y border-neutral-200/80 dark:border-neutral-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-[#1f6b4a] dark:text-emerald-300 mb-3">
            <Power className="w-3.5 h-3.5" />
            <span>{isAr ? 'بدون واجهات معقدة' : 'Zero Clutter Interface'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-3">
            {isAr ? 'موجود في شريط المهام.. بخيارين اتنين بس' : 'Lives in your tray.. with only two options'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isAr
              ? 'مفيش نوافذ إعدادات، مفيش إشعارات مزعجة، ومفيش أي حاجة تشتتك. كليك يمين على الأيقونة للتحكم الكامل.'
              : 'No settings windows, no pop-up toasts, and zero distractions. Right-click the tray icon for total control.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Explanatory bullets */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {isAr ? 'خفيف جداً على الجهاز' : 'Extremely Lightweight'}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isAr
                      ? 'بيستهلك أقل من 15 ميجابايت من الرام وصفر بالمية من المعالج. جهازك هيفضل سريع كأن مفيش برنامج شغال.'
                      : 'Consumes less than 15MB of RAM and 0% CPU while idle. Your laptop stays fast.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {isAr ? 'شغال مع كل برامجك' : 'Works with all your apps'}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isAr
                      ? 'سواء بتكتب في متصفح كروم، محادثة واتساب، إيميل أوتلوك، أو إكسل.. مبدّل شغال معاك في كل مكان.'
                      : 'Whether you type in Chrome, WhatsApp, Outlook, or Excel — Mubaddil is active everywhere.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#166534] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {isAr ? 'تقدر توقفه أو تشغله في ثانية' : 'Pause or resume in 1 second'}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isAr
                      ? 'كليك يمين على الأيقونة الخضراء جنب الساعة: دوس «شغّال» لو حابب توقفه مؤقتاً، أو «خروج» لقفل البرنامج.'
                      : 'Right click the green icon next to the clock: toggle "Active" to pause, or click "Quit" to exit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Interactive Windows Taskbar Simulation */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl bg-neutral-900 dark:bg-[#0d0f0e] p-6 text-white border border-neutral-800 shadow-xl overflow-hidden">
              <div className="text-xs text-neutral-400 mb-4 flex items-center justify-between">
                <span>{isAr ? 'محاكاة شريط مهام ويندوز 11:' : 'Windows 11 Taskbar Simulation:'}</span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {isAr ? 'اضغط على الأيقونة للمعاينة' : 'Click the icon to preview'}
                </span>
              </div>

              {/* Taskbar Representation */}
              <div className="relative pt-16 pb-3 px-4 rounded-xl bg-neutral-800/80 border border-neutral-700/60 backdrop-blur-md">
                {/* Authentic Windows Context Menu Popup */}
                {isMenuOpen && (
                  <div
                    className={`absolute bottom-16 ${
                      isAr ? 'left-6' : 'right-6'
                    } w-44 rounded-xl bg-[#202221]/95 border border-white/10 shadow-2xl p-1.5 text-neutral-200 text-xs backdrop-blur-xl animate-fade-in z-20`}
                  >
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold border-b border-white/5 mb-1">
                      {isAr ? 'مبدّل • Mubaddil' : 'Mubaddil Tray Menu'}
                    </div>

                    {/* Menu Item 1: شغّال (Toggle) */}
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      <span className="font-medium text-white">
                        {isAr ? 'شغّال' : 'Active'}
                      </span>
                      {isTrayActive && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>

                    {/* Menu Item 2: خروج */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsTrayActive(false);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-neutral-300 hover:text-red-300 transition-colors text-left cursor-pointer"
                    >
                      <span>{isAr ? 'خروج' : 'Exit / Quit'}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Taskbar Bar Content */}
                <div className="flex items-center justify-between text-neutral-300 text-xs">
                  {/* Taskbar pinned apps (Windows start, edge, folder) */}
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                      ⊞
                    </div>
                    <div className="w-5 h-5 rounded bg-sky-600/80 flex items-center justify-center text-[10px]">
                      🌐
                    </div>
                    <div className="w-5 h-5 rounded bg-amber-500/80 flex items-center justify-center text-[10px]">
                      📁
                    </div>
                  </div>

                  {/* System Tray icons corner */}
                  <div className="flex items-center gap-2.5 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                    {/* Mubaddil Icon in tray */}
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`relative w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                        isTrayActive
                          ? 'bg-[#166534] text-white ring-2 ring-emerald-400/40'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                      title={isAr ? 'مبدّل (انقر لفتح القائمة)' : 'Mubaddil (Click to open tray menu)'}
                    >
                      <span>مـ</span>
                      {isTrayActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>

                    <div className="h-3 w-px bg-white/10" />

                    {/* Windows standard tray icons */}
                    <Wifi className="w-3.5 h-3.5 text-neutral-400" />
                    <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                    <BatteryCharging className="w-3.5 h-3.5 text-neutral-400" />

                    <div className="h-3 w-px bg-white/10" />

                    {/* Clock & Language */}
                    <div className="text-[11px] font-mono text-neutral-300">
                      <span>ENG</span>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-300">
                      <span>10:42 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
                <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isAr
                    ? 'الحالة الحالية: البرنامج ' + (isTrayActive ? 'يعمل في الخلفية بنشاط' : 'متوقف مؤقتاً')
                    : 'Current Status: ' + (isTrayActive ? 'Active in background' : 'Paused')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

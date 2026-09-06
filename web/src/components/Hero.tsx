import React, { useState, useEffect, useRef } from 'react';
import { Download, RotateCcw, ShieldCheck, Check, ArrowDown } from 'lucide-react';
import { Language } from '../types';
import { SETUP_FILE, SETUP_NAME } from '../data/download';

interface HeroProps {
  lang: Language;
  onDownloadClick: () => void;
  onScrollToDemo: () => void;
}

type AnimationStage = 'typing_gibberish' | 'reaction' | 'deleting' | 'typing_solution' | 'ready';

export const Hero: React.FC<HeroProps> = ({ lang, onDownloadClick, onScrollToDemo }) => {
  const isAr = lang === 'ar';

  const [stage, setStage] = useState<AnimationStage>('typing_gibberish');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [solutionPart2, setSolutionPart2] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Script text definitions - Snappy, Short & Ultra-Fast Comprehension
  const gibberishText = 'hgsghl ugd;l...';
  const solutionTextPart1 = isAr ? 'كتبت عربي وطلع إنجليزي؟' : 'Typed Arabic & got English?';
  const solutionTextPart2 = isAr
    ? 'مبدّل بيصلحه أول ما تدوس مسافة.'
    : 'Mubaddil fixes it the second you hit Space.';

  const startAnimation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStage('typing_gibberish');
    setDisplayedText('');
    setSolutionPart2('');
  };

  useEffect(() => {
    startAnimation();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lang]);

  useEffect(() => {
    if (stage === 'typing_gibberish') {
      if (displayedText.length < gibberishText.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(gibberishText.slice(0, displayedText.length + 1));
        }, 75);
      } else {
        // Brief pause at full gibberish for the frustration reaction
        timerRef.current = setTimeout(() => {
          setStage('reaction');
        }, 400);
      }
    } else if (stage === 'reaction') {
      // Show the big explanation with smooth fading effect for 1200ms before deleting
      timerRef.current = setTimeout(() => {
        setStage('deleting');
      }, 1200);
    } else if (stage === 'deleting') {
      // Rapid backspace deletion
      if (displayedText.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayedText((prev) => prev.slice(0, -1));
        }, 30);
      } else {
        // Cleared, start typing solution
        timerRef.current = setTimeout(() => {
          setStage('typing_solution');
        }, 300);
      }
    } else if (stage === 'typing_solution') {
      // First type Part 1
      if (displayedText.length < solutionTextPart1.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(solutionTextPart1.slice(0, displayedText.length + 1));
        }, 50);
      } else if (solutionPart2.length < solutionTextPart2.length) {
        // Then type Part 2
        timerRef.current = setTimeout(() => {
          setSolutionPart2(solutionTextPart2.slice(0, solutionPart2.length + 1));
        }, 40);
      } else {
        // Finished typing solution! Transition to download
        timerRef.current = setTimeout(() => {
          setStage('ready');
        }, 350);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage, displayedText, solutionPart2]);

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayedText(solutionTextPart1);
    setSolutionPart2(solutionTextPart2);
    setStage('ready');
  };

  return (
    <section
      id="hero"
      className="relative min-h-[82vh] sm:min-h-[86vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden"
    >
      {/* Background subtle radial ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] blur-3xl pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center my-auto py-12">
        {/* Phase 1 & 2: Gibberish & Frustration */}
        {(stage === 'typing_gibberish' || stage === 'reaction' || stage === 'deleting') && (
          <div className="flex flex-col items-center justify-center min-h-[260px] transition-all w-full">
            {/* The Big Explaining Callout with Fading Effect */}
            <div
              className={`transition-all duration-700 ease-out flex flex-col items-center justify-center min-h-[72px] mb-5 ${
                stage === 'reaction' || stage === 'deleting'
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-100/90 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 shadow-md backdrop-blur-xs">
                <span className="text-2xl sm:text-3xl">🤦‍♂️</span>
                <span className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                  {isAr ? 'نسيت تقلب الكيبورد!' : 'Forgot to switch the keyboard!'}
                </span>
                {stage === 'deleting' && (
                  <span className="font-mono text-xs sm:text-sm bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded-lg animate-pulse font-bold ml-1">
                    [⌫ Backspace]
                  </span>
                )}
              </div>

              {/* Subtitle explaining the error with smooth fade */}
              <p className="mt-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                {isAr
                  ? '(كتبت بالإنجليزي وكان قصدك: السلام عليكم)'
                  : '(Typed on English layout when you meant Arabic)'}
              </p>
            </div>

            {/* The Gibberish Typography */}
            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-mono font-bold tracking-wider text-rose-600 dark:text-rose-400 select-none flex items-center justify-center"
              dir="ltr"
            >
              <span>{displayedText}</span>
              <span className="inline-block w-1 h-9 sm:h-14 bg-rose-500 ml-1 animate-pulse" />
            </h1>

            {/* Skip animation button */}
            <button
              type="button"
              onClick={handleSkip}
              className="mt-8 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline cursor-pointer"
            >
              {isAr ? 'تخطي المشهد' : 'Skip'}
            </button>
          </div>
        )}

        {/* Phase 3 & 4: Solution Written Out & Transition to Download */}
        {(stage === 'typing_solution' || stage === 'ready') && (
          <div className="flex flex-col items-center justify-center min-h-[220px] animate-fade-in w-full">
            {/* Micro Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-600/20 bg-emerald-50/80 dark:bg-emerald-950/50 text-[#166534] dark:text-emerald-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#166534] dark:bg-emerald-400 animate-pulse" />
              <span>{isAr ? 'تطبيق لويندوز 10 و 11 • مجاني 100%' : 'Windows App • 100% Free'}</span>
            </div>

            {/* Final Clean Display Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.25] sm:leading-[1.15] mb-4">
              <span>{displayedText}</span>
              {solutionPart2 && (
                <>
                  <br />
                  <span className="text-[#166534] dark:text-emerald-400">{solutionPart2}</span>
                </>
              )}
              {stage === 'typing_solution' && (
                <span className="inline-block w-1 h-8 sm:h-12 bg-[#166534] dark:bg-emerald-400 align-middle ml-1 mr-1 animate-pulse" />
              )}
            </h1>

            {/* Subtitle - Short, Punchy & Clear */}
            <p
              className={`text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto mb-8 leading-relaxed transition-opacity duration-500 ${
                stage === 'ready' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isAr
                ? 'بدون مسح وبدون Alt+Shift.. كمل كتابتك عادي ومبدّل هيقلب اللغة لوحده.'
                : 'No backspacing, no Alt+Shift. Keep typing and Mubaddil switches the layout automatically.'}
            </p>

            {/* The Direct Transition to Download */}
            <div
              className={`w-full max-w-md flex flex-col items-center justify-center transition-all duration-700 ${
                stage === 'ready'
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <a
                id="hero-direct-download-btn"
                href={SETUP_FILE}
                download={SETUP_NAME}
                className="w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#166534]/25 hover:shadow-2xl hover:shadow-[#166534]/35 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                <span>{isAr ? 'تحميل مباشر لويندوز (مجاني)' : 'Download for Windows (Free)'}</span>
              </a>

              {/* Micro reassurances */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-4">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#166534] dark:text-emerald-400" />
                  {isAr ? 'خفيف وسريع' : 'Lightweight'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#166534] dark:text-emerald-400" />
                  {isAr ? '100% أوفلاين' : '100% Offline'}
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={startAnimation}
                  className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  title={isAr ? 'إعادة المشهد' : 'Replay'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعادة' : 'Replay'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Scroll Indicator at bottom */}
      <button
        type="button"
        onClick={onScrollToDemo}
        className="pb-6 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors flex flex-col items-center gap-1 text-xs cursor-pointer"
      >
        <span>{isAr ? 'المزيد عن مبدّل' : 'Learn more'}</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </button>
    </section>
  );
};

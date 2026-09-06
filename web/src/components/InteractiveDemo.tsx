import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Check, Send, Paperclip, Smile, Globe2 } from 'lucide-react';
import { Language, DemoScenario } from '../types';
import { scenarios } from '../data/content';

interface InteractiveDemoProps {
  lang: Language;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState<boolean>(false);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);
  const scenario = scenarios[activeScenarioIndex];

  // Animation states
  const [displayedText, setDisplayedText] = useState<string>('');
  const [currentLayout, setCurrentLayout] = useState<'ENG' | 'عربي'>('ENG');
  const [step, setStep] = useState<number>(0); // 0: typing word 1, 1: flipped word 1, 2: typing word 2, 3: flipped word 2, 4: typing rest, 5: completed
  const [lastFlippedWord, setLastFlippedWord] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(true);

  // Automatic cycle ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAndPlay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayedText('');
    setCurrentLayout(scenario.startLayout);
    setStep(0);
    setLastFlippedWord(null);
    setIsTyping(true);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        setInView(visible);
        if (!visible) resetAndPlay();
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    resetAndPlay();
  }, [activeScenarioIndex]);

  useEffect(() => {
    if (!inView || !isTyping) return;

    const word1Raw = scenario.typed[0];
    const word1Fixed = scenario.converted[0];
    const word2Raw = scenario.typed[1];
    const word2Fixed = scenario.converted[1];
    const remainingText = isAr ? scenario.contextAr : scenario.contextEn;

    // Timeline-driven state machine
    if (step === 0) {
      // Step 0: type raw word 1 character by character
      const currentLength = displayedText.length;
      if (currentLength < word1Raw.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(word1Raw.slice(0, currentLength + 1));
        }, 130);
      } else {
        // Finished typing word 1, pause briefly before space & flip
        timerRef.current = setTimeout(() => {
          setStep(1);
        }, 400);
      }
    } else if (step === 1) {
      // Step 1: Flip word 1! Instant space hit -> layout switches to عربي, word converts
      setDisplayedText(word1Fixed + ' ');
      setCurrentLayout(scenario.startLayout === 'ENG' ? 'عربي' : 'ENG');
      setLastFlippedWord(word1Fixed);
      timerRef.current = setTimeout(() => {
        setStep(2);
      }, 550);
    } else if (step === 2) {
      // Step 2: type raw word 2
      const base = word1Fixed + ' ';
      const currentTypedPart = displayedText.slice(base.length);
      if (currentTypedPart.length < word2Raw.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(base + word2Raw.slice(0, currentTypedPart.length + 1));
        }, 130);
      } else {
        // Finished typing word 2, pause briefly
        timerRef.current = setTimeout(() => {
          setStep(3);
        }, 400);
      }
    } else if (step === 3) {
      // Step 3: Flip word 2!
      const finalTwoWords = `${word1Fixed} ${word2Fixed} `;
      setDisplayedText(finalTwoWords);
      setLastFlippedWord(word2Fixed);
      timerRef.current = setTimeout(() => {
        setStep(4);
      }, 600);
    } else if (step === 4) {
      // Step 4: type natural remaining sentence
      const base = `${word1Fixed} ${word2Fixed} `;
      const currentRest = displayedText.slice(base.length);
      if (currentRest.length < remainingText.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(base + remainingText.slice(0, currentRest.length + 1));
        }, 40);
      } else {
        setStep(5);
        // Loop back after 4 seconds
        timerRef.current = setTimeout(() => {
          resetAndPlay();
        }, 4500);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayedText, step, isTyping, inView, scenario, isAr]);

  return (
    <section id="demo" ref={sectionRef} className="py-12 md:py-20 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#166534] dark:text-emerald-400" />
            <span>{isAr ? 'شاهد التجربة الحية' : 'Watch the live demo'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
            {isAr ? 'بيصلح الكلمة ويبدّل الكيبورد.. فوراً' : 'Fixes the word & flips keyboard.. instantly'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isAr
              ? 'أول ما تدوس مسافة، مبدّل بيتعرف على الكلمة، يحولها للغة الصحيحة، ويحول كيبورد الويندوز تلقائياً.'
              : 'As soon as you hit Space, Mubaddil recognizes the intended word, converts it, and flips your OS keyboard layout.'}
          </p>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {scenarios.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveScenarioIndex(idx)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeScenarioIndex === idx
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700/80'
              }`}
            >
              {isAr ? sc.titleAr : sc.titleEn}
            </button>
          ))}
        </div>

        {/* Fake Desktop Window Mockup */}
        <div className="rounded-2xl border border-neutral-300/80 dark:border-neutral-800 bg-white dark:bg-[#181a19] shadow-xl overflow-hidden">
          {/* Window Title Bar */}
          <div className="h-11 px-4 bg-neutral-100/90 dark:bg-[#121413] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-2 ml-2">
                {isAr ? scenario.titleAr : scenario.titleEn}
              </span>
            </div>

            {/* Windows Language Layout Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                <Globe2 className="w-3 h-3 text-[#166534] dark:text-emerald-400" />
                <span>{currentLayout}</span>
                <span className="text-[10px] text-neutral-400">
                  {currentLayout === 'ENG' ? '(English US)' : '(عربي 101)'}
                </span>
              </div>
              <button
                type="button"
                onClick={resetAndPlay}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                title={isAr ? 'إعادة تشغيل' : 'Replay'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat / Message Area */}
          <div className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-between bg-gradient-to-b from-neutral-50/50 to-white dark:from-[#181a19] dark:to-[#141615]">
            {/* Context message balloon (simulating recipient message) */}
            <div className="max-w-md p-3 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mb-6">
              <span className="block font-semibold text-[11px] text-neutral-500 mb-1">
                {isAr ? 'أحمد (مدير الفريق)' : 'Ahmed (Team Lead)'}
              </span>
              <span>
                {isAr
                  ? 'صباح الفل يا شباب، طمنوني على تقرير المبيعات والأرقام النهائية؟'
                  : 'Good morning team, any update on the weekly sales figures?'}
              </span>
            </div>

            {/* Active Compose Field */}
            <div className="relative rounded-xl border-2 border-emerald-500/40 bg-white dark:bg-neutral-900 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-h-[44px] text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-relaxed">
                  {displayedText.length > 0 ? (
                    <span className="tracking-wide">
                      {displayedText}
                      <span className="inline-block w-0.5 h-5 bg-[#166534] dark:bg-emerald-400 align-middle -mt-0.5 animate-pulse ml-0.5 mr-0.5" />
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-sm font-normal">
                      {isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    </span>
                  )}
                </div>

                {/* Instant Feedback Badge */}
                {step >= 1 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-[#166534] dark:text-emerald-300 animate-fade-in shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? 'تم التبديل تلقائياً' : 'Auto-switched'}
                    </span>
                  </div>
                )}
              </div>

              {/* Compose Bar Footer Toolbar */}
              <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-400 text-xs">
                <div className="flex items-center gap-3">
                  <Smile className="w-4 h-4 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-200" />
                  <Paperclip className="w-4 h-4 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-200" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? '⚡ بيبدّل الكلمة ويقلب اللغة أول ما تدوس مسافة' : '⚡ Replaces the word & switches layout when you tap Space'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-[#1b6345] text-white hover:bg-[#144c34] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Simple Catchphrase Footer */}
          <div className="px-6 py-3.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1b6345] dark:bg-emerald-400"></span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {isAr ? 'النتيجة في ثانية واحدة:' : 'The result in 1 second:'}
              </span>
              <span className="text-neutral-600 dark:text-neutral-300">
                {isAr ? 'الكلام بيتصلح ولغة الويندوز بتتقلب من غير ما تدوس مسح ولا Alt+Shift.' : 'Word is fixed and Windows layout flips without backspacing or pressing Alt+Shift.'}
              </span>
            </div>
            <button
              type="button"
              onClick={resetAndPlay}
              className="flex items-center gap-1.5 text-xs text-[#1b6345] dark:text-emerald-400 font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'جرّب تاني' : 'Replay'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Clock, Smile, Sparkles, TrendingDown } from 'lucide-react';
import { Language } from '../types';

interface TimeSavingsProps {
  lang: Language;
}

export const TimeSavingsAndFrustration: React.FC<TimeSavingsProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [dailyMessages, setDailyMessages] = useState<number>(30);

  const mistypedPerDay = Math.round(dailyMessages * 0.35);
  const minutesSavedDaily = Math.round((mistypedPerDay * 25) / 60);
  const hoursSavedYearly = Math.round((minutesSavedDaily * 240) / 60);

  return (
    <section id="why" className="py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6345] dark:text-emerald-300 mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'وقتك' : 'Your time'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isAr ? 'كام دقيقة بتضيع كل يوم؟' : 'How many minutes do you lose a day?'}
          </h2>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#161817] border border-neutral-200/80 dark:border-neutral-800 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <label htmlFor="messages-slider" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {isAr ? 'رسائلك في اليوم' : 'Messages a day'}
            </label>
            <input
              id="messages-slider"
              type="range"
              min="10"
              max="80"
              step="5"
              value={dailyMessages}
              onChange={(e) => setDailyMessages(Number(e.target.value))}
              className="w-48 sm:w-64 accent-[#1b6345] h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="font-bold text-lg text-[#1b6345] dark:text-emerald-400 min-w-[4rem]">
              {dailyMessages}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-[#1b6345] dark:text-emerald-400" />
              <div className="text-2xl font-black text-[#1b6345] dark:text-emerald-400">
                ~{minutesSavedDaily} {isAr ? 'دقيقة' : 'min'}
              </div>
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {isAr ? 'كل يوم' : 'a day'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <TrendingDown className="w-5 h-5 mx-auto mb-2 text-[#1b6345] dark:text-emerald-400" />
              <div className="text-2xl font-black text-[#1b6345] dark:text-emerald-400">
                {hoursSavedYearly}+ {isAr ? 'ساعة' : 'hrs'}
              </div>
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {isAr ? 'في السنة' : 'a year'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <Smile className="w-5 h-5 mx-auto mb-2 text-[#1b6345] dark:text-emerald-400" />
              <div className="text-2xl font-black text-[#1b6345] dark:text-emerald-400">
                0
              </div>
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {isAr ? 'إحراج' : 'awkward sends'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 text-center">
            <div className="text-xl mb-1">🧼</div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              {isAr ? 'من غير مسح' : 'No backspace'}
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 text-center">
            <div className="text-xl mb-1">🧠</div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              {isAr ? 'تركيزك يفضل' : 'Stay focused'}
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 text-center">
            <div className="text-xl mb-1">🪶</div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              {isAr ? 'خفيف وصامت' : 'Light and quiet'}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

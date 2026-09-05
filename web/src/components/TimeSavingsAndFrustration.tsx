import React, { useState } from 'react';
import { Clock, Smile, ShieldAlert, Sparkles, TrendingDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface TimeSavingsProps {
  lang: Language;
}

export const TimeSavingsAndFrustration: React.FC<TimeSavingsProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [dailyMessages, setDailyMessages] = useState<number>(30);

  // Estimates:
  // Each mistyped message takes ~30 seconds of noticing, backspacing, switching layout, and retyping.
  // Assuming ~30% of opening messages hit the wrong layout.
  const mistypedPerDay = Math.round(dailyMessages * 0.35);
  const minutesSavedDaily = Math.round((mistypedPerDay * 25) / 60);
  const hoursSavedYearly = Math.round((minutesSavedDaily * 240) / 60); // 240 work days

  return (
    <section id="why" className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6345] dark:text-emerald-300 mb-3 border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'وداعاً للعصبية والتشتيت' : 'Zero frustration, pure focus'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
            {isAr ? 'كام دقيقة وعصبية بتضيعهم كل يوم؟' : 'How much time & stress do you lose daily?'}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {isAr
              ? 'المشكلة مش بس في الثواني اللي بتضيع.. المشكلة في إن حبل أفكارك بيتقطع كل ما تبص تلاقي الكلام طلع طلاسم!'
              : 'It’s not just seconds ticking away — it is the sudden mental brake every time you look up and see gibberish.'}
          </p>
        </div>

        {/* Interactive Estimator Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161817] border border-neutral-200/80 dark:border-neutral-800 shadow-xl mb-12">
          <div className="max-w-xl mx-auto text-center mb-8">
            <label htmlFor="messages-slider" className="block text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {isAr
                ? 'بتكتب تقريباً كام رسالة أو إيميل في اليوم في شغلك؟'
                : 'Roughly how many messages or emails do you type a day?'}
            </label>
            <div className="flex items-center justify-center gap-3">
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
              <span className="font-bold text-lg text-[#1b6345] dark:text-emerald-400 min-w-[3rem]">
                {dailyMessages} {isAr ? 'رسالة' : 'msgs'}
              </span>
            </div>
          </div>

          {/* 3 Result Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#1b6345] text-white flex items-center justify-center mb-3 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1b6345] dark:text-emerald-400 mb-1">
                ~{minutesSavedDaily} {isAr ? 'دقيقة' : 'mins'}
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'هتوفرهم كل يوم' : 'Saved every single day'}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr ? 'بدل مسح الحروف وإعادة كتابة الجمل من الأول' : 'Instead of backspacing & retyping words'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#1b6345] text-white flex items-center justify-center mb-3 shadow-sm">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1b6345] dark:text-emerald-400 mb-1">
                {hoursSavedYearly}+ {isAr ? 'ساعة' : 'hours'}
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'في السنة راحة لبالك' : 'Saved every year'}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr ? 'وقت تخلص فيه شغلك بدري وتروح مرتاح' : 'Finish your tasks faster and leave on time'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#1b6345] text-white flex items-center justify-center mb-3 shadow-sm">
                <Smile className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1b6345] dark:text-emerald-400 mb-1">
                0 {isAr ? 'إحراج' : 'embarrassment'}
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                {isAr ? 'مع مديرك أو عملائك' : 'With clients or managers'}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr ? 'مفيش رسالة طلاسم هتروح بالغلط أبداً' : 'Never accidentally hit Enter on gibberish'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Real Life Everyday Relief Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            <div className="text-2xl mb-3">🧼</div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              {isAr ? 'انسى زرار الـ Backspace' : 'Forget the Backspace Key'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isAr
                ? 'لما تكتشف إنك كتبت كلمة بالإنجليزي الغلط، مش محتاج تمسحها ولا ترفع إيدك.. أول ما تدوس مسافة مبدّل هيقلبها لعربي في لمح البصر.'
                : 'No more furiously hitting backspace. As soon as you tap Space, Mubaddil swaps the word and layout instantly.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              {isAr ? 'تركيزك هيفضل شغال' : 'Your Train of Thought Stays Intact'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isAr
                ? 'لما تكون مستعجل وعايز تكتب فكرة سريعة، مش هتقف تعيد ترتيب لغة الويندوز كل شوية وتفقد تركيزك في الشغل.'
                : 'Stay in the zone. Type your thoughts quickly without constant Alt+Shift layout interruptions.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#181a19] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            <div className="text-2xl mb-3">🪶</div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              {isAr ? 'خفيف ومش بيطلب منك حاجة' : 'Zero Setup, Completely Silent'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isAr
                ? 'مفيش إعدادات تظبطها ومفيش شاشات تظهر في وشك. دبل كليك، وهيقعد في شريط المهام جنب الساعة ينفذ شغله بس.'
                : 'No complicated settings or annoying popups. It just sits quietly by your Windows clock and does its job.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

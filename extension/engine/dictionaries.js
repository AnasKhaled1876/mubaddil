(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const ARABIC_WORDS = `
السلام عليكم ورحمة وبركاته مرحبا اهلا اهلاً سهلا شكرا شكراً عفوا نعم لا من فضلك لو سمحت
صباح الخير مساء الحمد لله إن شاء الله ما شاء الله الحمدلله يارب يا رب تسلم الله يعطيك العافية
كيف حالك اخبارك تمام بخير الحمد الحمدلله انا انت انتي هو هي نحن هم هن هذا هذه ذلك تلك
الذي التي الذين اللواتي في من على إلى الى عن مع أو او ثم قد لم لن كل بعض بعد قبل بين
تحت فوق هنا هناك كيف ماذا متى اين أين لماذا لان لأن اذا إذا حتى عند غير نفس مثل اول أول
اخر آخر جديد قديم كبير صغير كثير قليل حسن جيد سيء تمام حاضر ممكن ضروري مهم سريع بطيء
اليوم غدا غداً امس أمس الان الآن جدا فقط ايضا أيضا لكن ايضاً العمل البيت المدرسة الكتاب
الاسم رقم هاتف رسالة اجتماع موعد رجاء انتظر دقيقة
مصر السعودية الامارات الإمارات الكويت قطر البحرين عمان الاردن الأردن لبنان العراق المغرب
تونس الجزائر السودان اليمن فلسطين سوريا ليبيا
الكتب الكتابة العربي العربية انجليزي الانجليزية الكمبيوتر ويندوز ابل ماك كيبورد لوحة المفاتيح
اللغة غلط خطأ صح صحيح كلمة جملة نص كتب يكتب اكتب اريد اريد احتاج ممكن هل يوجد يوجد
افتح اغلق احفظ ارسل احذف ابحث ادخل اخرج ابدأ انتهي انتهى
الرجاء التأكد التحويل التبديل التصحيح
`.trim();

  const ENGLISH_WORDS = `
the be to of and a in that have i it for not on with he as you do at this but his by from
they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some
could them see other than then now look only come its over think also back after use two how
our work first well way even new want because any these give day most us hello hi hey thanks
thank please yes okay ok meeting email message boss please sorry welcome morning evening
arabic english keyboard language layout switch convert fix wrong type typing write written
windows mac laptop computer phone whatsapp word excel outlook gmail browser chrome
name number please wait minute second today tomorrow yesterday now later
egypt saudi emirates kuwait qatar bahrain oman jordan lebanon iraq morocco tunisia
algeria sudan yemen palestine syria
`.trim();

  function toSet(text) {
    return new Set(
      text
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean)
    );
  }

  KeyboardFix.ARABIC_WORDS = toSet(ARABIC_WORDS);
  KeyboardFix.ENGLISH_WORDS = toSet(ENGLISH_WORDS);
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);

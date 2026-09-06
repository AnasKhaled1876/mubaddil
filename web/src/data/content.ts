import { DemoScenario, FaqItem } from '../types';

export const scenarios: DemoScenario[] = [
  {
    id: 'greeting',
    titleAr: 'رسالة لمديرك على واتساب',
    titleEn: 'Message to manager on WhatsApp',
    typed: ['hgsghl', 'ugd;l'],
    converted: ['السلام', 'عليكم'],
    contextAr: '، بخصوص تقرير مبيعات الأسبوع جاهز للمراجعة.',
    contextEn: ', regarding the weekly sales report, it is ready for review.',
    app: 'whatsapp',
  },
  {
    id: 'name',
    titleAr: 'إيميل رسمي في أوتلوك',
    titleEn: 'Formal email in Outlook',
    typed: ['Hks', 'ohgn'],
    converted: ['أنس', 'خالد'],
    contextAr: '، أرجو تأكيد موعد الاجتماع غداً الساعة العاشرة.',
    contextEn: ', please confirm tomorrow\'s meeting at 10:00 AM.',
    app: 'outlook',
  },
  {
    id: 'english_reverse',
    titleAr: 'محادثة عمل على سلاك (عربي ← إنجليزي)',
    titleEn: 'Work chat on Slack (AR → EN)',
    typed: ['اثممخ', 'فاثقث'],
    converted: ['hello', 'there'],
    contextAr: ' have you checked the new project guidelines?',
    contextEn: ' have you checked the new project guidelines?',
    app: 'slack',
  },
];

export const faqs: FaqItem[] = [
  {
    questionAr: 'هل بيعدل كل الرسالة ولا بس الكلمات الغلط في البداية؟',
    questionEn: 'Does it modify the entire message or just the opening words?',
    answerAr: 'بيفحص ويعدل أول كلمتين بس في الحقل. أول ما يفهم الكلمة ويبدّل لغة الويندوز تلقائياً، بيبعد ويسيبك تكمل كتابتك براحتك ومن غير أي تدخل، عشان يضمن إن الكلام ما يتلخبطش أبداً.',
    answerEn: 'It only inspects and corrects the first 1–2 words of any field. Once it detects the mistyped opening and switches Windows layout, it idles completely so you can type the rest freely without interruptions.',
  },
  {
    questionAr: 'كام سعر مبدّل؟ فيه اشتراك؟',
    questionEn: 'How much is Mubaddil? Is there a subscription?',
    answerAr: 'دفعة واحدة 99 جنيه. مفيش اشتراك شهري، ومفيش إعلانات. بعد الدفع بيتفتح تحميل الملف، ودبل كليك وبتستخدمه علطول.',
    answerEn: 'It is a one-time 99 EGP purchase. No monthly subscription and no ads. After payment is confirmed, the installer unlocks and you can start using it immediately.',
  },
  {
    questionAr: 'هل بيسجل اللي بكتبه أو بيبعت داتا للإنترنت؟',
    questionEn: 'Does it log my keystrokes or send data to the internet?',
    answerAr: 'نهائياً. مبدّل شغال أوفلاين بالكامل على جهازك 100%. معندوش سيرفرات، مبيطلبش إنترنت، ومبيحفظش أي حرف بتكتبه. خصوصيتك وخصوصية شغلك في أمان تام.',
    answerEn: 'Never. Mubaddil operates entirely offline on your local machine. No external servers, no internet requests, and no keystroke logging. Your private workplace data stays private.',
  },
  {
    questionAr: 'بيشتغل على برامج إيه؟',
    questionEn: 'Which applications does it support?',
    answerAr: 'بيشتغل على كل برامج ويندوز على مستوى النظام كله: متصفح كروم وإيدج، واتساب، مايكروسوفت أوتلوك، إكسل، وورد، سلاك، تيمز، نوت باد، وأي مكان بتكتب فيه.',
    answerEn: 'It runs system-wide across all Windows applications: Chrome, Edge, WhatsApp, Outlook, Excel, Word, Slack, Teams, Notepad, and wherever you type.',
  },
  {
    questionAr: 'هل بيضيف لغة أو كيبورد جديدة للجهاز ويسبب زحمة؟',
    questionEn: 'Does it install unwanted keyboard layouts on my system?',
    answerAr: 'لا، مبدّل مابيضيفش أي لغات جديدة إطلاقاً. هو بيبدّل بس بين اللغات اللي متثبتة بالفعل على جهازك (عربي وإنجليزي)، علشان شريط اللغات يفضل منظم ونظيف.',
    answerEn: 'No, Mubaddil never installs or registers new keyboards. It only alternates between the existing Arabic and English layouts already on your machine.',
  },
  {
    questionAr: 'إزاي أوقفه مؤقتاً أو أقفله خالص؟',
    questionEn: 'How do I toggle or quit the app?',
    answerAr: 'من أيقونة مبدّل الصغيرة في شريط المهام (جنب الساعة): كليك يمين عليها هتلاقي خيارين بس: «شغّال» للتشغيل أو الإيقاف المؤقت، و«خروج» لقفل البرنامج. مفيش إعدادات معقدة ولا دوشة.',
    answerEn: 'Right-click the small Mubaddil tray icon next to your Windows clock: you will find only two options: "Active" (toggle on/off) and "Quit". No complex menus or clutter.',
  },
];

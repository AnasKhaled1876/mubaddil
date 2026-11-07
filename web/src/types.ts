export type Language = 'ar' | 'en';

export type Theme = 'light' | 'dark';

export interface DemoScenario {
  id: string;
  titleAr: string;
  titleEn: string;
  typed: string[];
  converted: string[];
  contextAr: string;
  contextEn: string;
  app: 'whatsapp' | 'slack' | 'outlook';
  startLayout: 'ENG' | 'عربي';
}

export interface FaqItem {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

import React, { useState, useEffect } from 'react';
import { Language, Theme } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { InteractiveDemo } from './components/InteractiveDemo';
import { TimeSavingsAndFrustration } from './components/TimeSavingsAndFrustration';
import { TrayPreview } from './components/TrayPreview';
import { DownloadSection } from './components/DownloadSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { StandaloneHtmlModal } from './components/StandaloneHtmlModal';
import { PaymentPage } from './components/PaymentPage';

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('light');
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState<boolean>(false);
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const scrollToDownload = () => {
    const el = document.getElementById('download');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDemo = () => {
    const el = document.getElementById('demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (path.startsWith('/payment')) {
    return (
      <PaymentPage
        lang={lang}
        theme={theme}
        onToggleLang={toggleLang}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] dark:bg-[#111312] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDownloadClick={scrollToDownload}
      />

      <main className="flex-1">
        <Hero
          lang={lang}
          onDownloadClick={scrollToDownload}
          onScrollToDemo={scrollToDemo}
        />

        <InteractiveDemo lang={lang} />

        <TimeSavingsAndFrustration lang={lang} />

        <TrayPreview lang={lang} />

        <DownloadSection lang={lang} />

        <FaqSection lang={lang} />
      </main>

      <Footer
        lang={lang}
        onOpenHtmlModal={() => setIsHtmlModalOpen(true)}
      />

      <StandaloneHtmlModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}

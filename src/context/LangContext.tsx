import { createContext, useContext, useState, type ReactNode } from 'react';
import ar from '../i18n/ar.json';
import en from '../i18n/en.json';

type Lang = 'ar' | 'en';
const DICTS = { ar, en } as const;

interface LangState {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (path: string) => string;
  toggle: () => void;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangState | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem('wms_lang') as Lang) || 'ar');

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('wms_lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }

  function t(path: string): string {
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = DICTS[lang];
    for (const p of parts) node = node?.[p];
    return node ?? path;
  }

  return (
    <LangContext.Provider value={{
      lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      setLang,
    }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

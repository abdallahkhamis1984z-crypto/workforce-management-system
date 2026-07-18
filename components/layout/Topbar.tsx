import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, signOut } = useAuth();
  const { t, lang, toggle } = useLang();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={onMenuClick} aria-label="menu">
        ☰
      </button>
      <div className="hidden text-sm text-slate-500 md:block">
        {profile?.full_name} · <span className="font-semibold text-slate-700">{profile?.role}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
        <button
          onClick={signOut}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          {t('nav.logout')}
        </button>
      </div>
    </header>
  );
}

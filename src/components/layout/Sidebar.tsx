import { NavLink } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/', key: 'nav.dashboard', roles: ['admin', 'hr_manager', 'production_manager', 'supervisor', 'viewer'] },
  { to: '/employees', key: 'nav.employees', roles: ['admin', 'hr_manager', 'production_manager'] },
  { to: '/attendance', key: 'nav.attendance', roles: ['admin', 'hr_manager', 'production_manager', 'supervisor'] },
  { to: '/evaluation/workers', key: 'nav.worker_evaluation', roles: ['admin', 'hr_manager', 'production_manager'] },
  { to: '/evaluation/supervisors', key: 'nav.supervisor_evaluation', roles: ['admin', 'hr_manager'] },
  { to: '/reports', key: 'nav.reports', roles: ['admin', 'hr_manager', 'production_manager', 'viewer'] },
  { to: '/notifications', key: 'nav.notifications', roles: ['admin', 'hr_manager', 'production_manager', 'supervisor'] },
];

export function Sidebar({ open }: { open: boolean }) {
  const { t } = useLang();
  const { profile } = useAuth();
  const role = profile?.role ?? 'viewer';

  return (
    <aside
      className={`fixed inset-y-0 z-40 w-64 transform bg-slate-900 text-slate-200 transition-transform
        md:static md:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full rtl:translate-x-full ltr:-translate-x-full'}`}
    >
      <div className="border-b border-slate-800 p-5 text-lg font-bold text-white">{t('app_name')}</div>
      <nav className="flex flex-col gap-1 p-3">
        {LINKS.filter(l => l.roles.includes(role)).map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
              }`
            }
          >
            {t(l.key)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

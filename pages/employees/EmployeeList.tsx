import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useLang } from '../../context/LangContext';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import type { Employee } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  active: '#16a34a', suspended: '#dc2626', on_leave: '#ca8a04',
  resigned: '#64748b', terminated: '#334155',
};

export default function EmployeeList() {
  const { t } = useLang();
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('employees')
      .select('*')
      .order('employee_code')
      .then(({ data }) => {
        setRows((data as Employee[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.employee_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">{t('nav.employees')}</h1>
        <div className="flex gap-2">
          <input
            placeholder={t('common.search')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <Link to="/employees/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            + {t('common.add_new')}
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <DataTable<Employee>
          rows={filtered}
          columns={[
            { header: 'Code', render: r => <span className="font-mono text-xs">{r.employee_code}</span> },
            { header: 'Name', render: r => <span className="font-medium">{r.full_name}</span> },
            { header: 'Position', render: r => r.position },
            { header: 'Shift', render: r => r.shift },
            { header: 'Status', render: r => <Badge text={r.employment_status} color={STATUS_COLOR[r.employment_status]} /> },
            { header: 'Hired', render: r => new Date(r.hiring_date).toLocaleDateString() },
            {
              header: '', render: r => (
                <Link to={`/employees/${r.id}`} className="text-blue-600 hover:underline">{t('common.edit')}</Link>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

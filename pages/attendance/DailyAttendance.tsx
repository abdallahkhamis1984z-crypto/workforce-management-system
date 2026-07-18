import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import type { AttendanceRecord, AttendanceStatus, Employee } from '../../types';

const STATUS_OPTIONS: AttendanceStatus[] = [
  'present', 'absent', 'weekly_off', 'annual_leave', 'sick_leave', 'casual_leave',
  'permission', 'mission', 'overtime', 'late', 'early_leave', 'suspension',
];

type DraftRow = Partial<AttendanceRecord> & { employee_id: string };

export default function DailyAttendance() {
  const { t } = useLang();
  const { profile } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let query = supabase.from('employees').select('*').eq('employment_status', 'active');
    // Supervisors only see their own team — enforced again server-side via RLS
    if (profile?.role === 'supervisor') query = query.eq('supervisor_id', profile.id);
    query.then(({ data }) => setEmployees((data as Employee[]) ?? []));
  }, [profile]);

  useEffect(() => {
    supabase.from('attendance_records').select('*').eq('record_date', date).then(({ data }) => {
      const map: Record<string, DraftRow> = {};
      (data as AttendanceRecord[] ?? []).forEach(r => { map[r.employee_id] = r; });
      setDrafts(map);
    });
  }, [date]);

  function setRow(employeeId: string, patch: Partial<DraftRow>) {
    setDrafts(d => ({
      ...d,
      [employeeId]: { ...(d[employeeId] ?? { employee_id: employeeId, status: 'present' }), ...patch },
    }));
  }

  const summary = useMemo(() => {
    const values = Object.values(drafts);
    return {
      present: values.filter(v => v.status === 'present').length,
      absent: values.filter(v => v.status === 'absent').length,
      leave: values.filter(v => ['annual_leave', 'sick_leave', 'casual_leave'].includes(v.status ?? '')).length,
      overtimeHours: values.reduce((s, v) => s + (v.overtime_hours || 0), 0),
    };
  }, [drafts]);

  async function saveAll() {
    setSaving(true);
    const rows = employees.map(e => {
      const d = drafts[e.id] ?? { employee_id: e.id, status: 'present' as AttendanceStatus };
      return {
        employee_id: e.id,
        record_date: date,
        status: d.status ?? 'present',
        permission_hours: d.permission_hours ?? 0,
        overtime_hours: d.overtime_hours ?? 0,
        late_minutes: d.late_minutes ?? 0,
        early_leave_minutes: d.early_leave_minutes ?? 0,
        notes: d.notes ?? null,
        recorded_by: profile?.id,
      };
    });
    await supabase.from('attendance_records').upsert(rows, { onConflict: 'employee_id,record_date' });
    setSaving(false);
    setSavedMsg('✓ Saved');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">{t('nav.attendance')}</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-auto" />
      </div>

      {/* live auto-calculated summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Present" value={summary.present} color="text-emerald-600" />
        <MiniStat label="Absent" value={summary.absent} color="text-red-600" />
        <MiniStat label="On Leave" value={summary.leave} color="text-amber-600" />
        <MiniStat label="OT Hours" value={summary.overtimeHours} color="text-blue-600" />
      </div>

      {/* mobile-friendly card list (stacks on small screens) + table on desktop */}
      <div className="space-y-3 md:hidden">
        {employees.map(e => (
          <AttendanceCard key={e.id} employee={e} draft={drafts[e.id]} onChange={p => setRow(e.id, p)} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-start">Employee</th>
              <th className="px-3 py-2 text-start">Status</th>
              <th className="px-3 py-2 text-start">Permission (hrs)</th>
              <th className="px-3 py-2 text-start">Overtime (hrs)</th>
              <th className="px-3 py-2 text-start">Late (min)</th>
              <th className="px-3 py-2 text-start">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(e => {
              const d = drafts[e.id];
              return (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-medium">{e.full_name}</td>
                  <td className="px-3 py-2">
                    <select
                      value={d?.status ?? 'present'}
                      onChange={ev => setRow(e.id, { status: ev.target.value as AttendanceStatus })}
                      className="input"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`attendance_status.${s}`)}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.5" min={0} value={d?.permission_hours ?? 0}
                      onChange={ev => setRow(e.id, { permission_hours: +ev.target.value })} className="input w-20" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.5" min={0} value={d?.overtime_hours ?? 0}
                      onChange={ev => setRow(e.id, { overtime_hours: +ev.target.value })} className="input w-20" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={d?.late_minutes ?? 0}
                      onChange={ev => setRow(e.id, { late_minutes: +ev.target.value })} className="input w-20" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={d?.notes ?? ''} onChange={ev => setRow(e.id, { notes: ev.target.value })} className="input" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-4 mt-4 flex justify-end">
        <button
          onClick={saveAll} disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : savedMsg || t('common.save')}
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AttendanceCard({
  employee, draft, onChange,
}: { employee: Employee; draft?: DraftRow; onChange: (p: Partial<DraftRow>) => void }) {
  const { t } = useLang();
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="mb-2 font-semibold text-slate-800">{employee.full_name}</p>
      <select
        value={draft?.status ?? 'present'}
        onChange={e => onChange({ status: e.target.value as AttendanceStatus })}
        className="input mb-2 w-full"
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`attendance_status.${s}`)}</option>)}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-slate-500">
          Permission (h)
          <input type="number" step="0.5" min={0} value={draft?.permission_hours ?? 0}
            onChange={e => onChange({ permission_hours: +e.target.value })} className="input mt-1" />
        </label>
        <label className="text-xs text-slate-500">
          Overtime (h)
          <input type="number" step="0.5" min={0} value={draft?.overtime_hours ?? 0}
            onChange={e => onChange({ overtime_hours: +e.target.value })} className="input mt-1" />
        </label>
        <label className="text-xs text-slate-500">
          Late (min)
          <input type="number" min={0} value={draft?.late_minutes ?? 0}
            onChange={e => onChange({ late_minutes: +e.target.value })} className="input mt-1" />
        </label>
      </div>
    </div>
  );
}

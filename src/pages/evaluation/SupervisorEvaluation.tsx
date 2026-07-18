import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { calcSupervisorScore, SUPERVISOR_KPI_WEIGHTS, type SupervisorKpiInput } from '../../lib/calculations';
import type { Profile } from '../../types';

const EMPTY: SupervisorKpiInput = {
  attendance_discipline: 90, production_target_pct: 90, oee_pct: 80,
  team_absenteeism_pct: 5, training_completion_pct: 90, safety_performance_pct: 95,
  employee_turnover_pct: 2, quality_performance_pct: 90, material_losses_pct: 3,
  daily_reporting_completion_pct: 100,
};

const FIELDS: { key: keyof SupervisorKpiInput; label: string; inverted?: boolean }[] = [
  { key: 'attendance_discipline', label: 'Attendance Discipline (%)' },
  { key: 'production_target_pct', label: 'Production Target Achievement (%)' },
  { key: 'oee_pct', label: 'OEE Achievement (%)' },
  { key: 'team_absenteeism_pct', label: 'Team Absenteeism (%) — lower is better', inverted: true },
  { key: 'training_completion_pct', label: 'Training Completion (%)' },
  { key: 'safety_performance_pct', label: 'Safety Performance (%)' },
  { key: 'employee_turnover_pct', label: 'Employee Turnover (%) — lower is better', inverted: true },
  { key: 'quality_performance_pct', label: 'Product Quality Performance (%)' },
  { key: 'material_losses_pct', label: 'Material Losses (%) — lower is better', inverted: true },
  { key: 'daily_reporting_completion_pct', label: 'Daily Reporting Completion (%)' },
];

export default function SupervisorEvaluation() {
  const [supervisors, setSupervisors] = useState<Profile[]>([]);
  const [supervisorId, setSupervisorId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [input, setInput] = useState<SupervisorKpiInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'supervisor').order('full_name')
      .then(({ data }) => setSupervisors((data as Profile[]) ?? []));
  }, []);

  const score = calcSupervisorScore(input);

  async function save() {
    if (!supervisorId) return;
    setSaving(true);
    await supabase.from('supervisor_evaluations').upsert({
      supervisor_id: supervisorId, eval_year: year, eval_month: month,
      ...input, total_score: score,
    }, { onConflict: 'supervisor_id,eval_year,eval_month' });
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Supervisor Monthly KPI</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="input">
          <option value="">Select supervisor…</option>
          {supervisors.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <input type="number" value={year} onChange={e => setYear(+e.target.value)} className="input" />
        <select value={month} onChange={e => setMonth(+e.target.value)} className="input">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        {FIELDS.map(f => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 flex justify-between text-slate-600">
              <span>{f.label}</span>
              <span className="text-slate-400">{SUPERVISOR_KPI_WEIGHTS[f.key]}%</span>
            </span>
            <input
              type="number" min={0} max={100} value={input[f.key]}
              onChange={e => setInput(v => ({ ...v, [f.key]: +e.target.value }))}
              className="input"
            />
          </label>
        ))}

        <div className="col-span-full mt-2 rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">Composite Supervisor Score (auto-calculated)</p>
          <p className="text-3xl font-bold text-slate-800">{score}<span className="text-base text-slate-400"> /100</span></p>
        </div>

        <button
          onClick={save} disabled={saving || !supervisorId}
          className="col-span-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Evaluation'}
        </button>
      </div>
    </div>
  );
}

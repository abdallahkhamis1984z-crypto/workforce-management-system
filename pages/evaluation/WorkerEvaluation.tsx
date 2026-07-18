import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { calcWorkerEvaluation, EVAL_LEVEL_LABEL, EVAL_WEIGHTS, type WorkerEvalInput } from '../../lib/calculations';
import { Badge } from '../../components/ui/Badge';
import type { Employee } from '../../types';

const EMPTY_INPUT: WorkerEvalInput = {
  attendanceRaw: 100, productivityRaw: 80, qualityRaw: 80,
  disciplineRaw: 100, teamworkRaw: 100, safetyRaw: 100,
};

export default function WorkerEvaluation() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [input, setInput] = useState<WorkerEvalInput>(EMPTY_INPUT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('employees').select('*').eq('employment_status', 'active').order('full_name')
      .then(({ data }) => setEmployees((data as Employee[]) ?? []));
  }, []);

  const result = calcWorkerEvaluation(input);
  const levelInfo = EVAL_LEVEL_LABEL[result.level];

  async function save() {
    if (!employeeId) return;
    setSaving(true);
    await supabase.from('worker_evaluations').upsert({
      employee_id: employeeId, eval_year: year, eval_month: month,
      attendance_score: result.attendance_score,
      productivity_score: result.productivity_score,
      quality_score: result.quality_score,
      discipline_score: result.discipline_score,
      teamwork_score: result.teamwork_score,
      safety_score: result.safety_score,
      level: result.level,
    }, { onConflict: 'employee_id,eval_year,eval_month' });
    setSaving(false);
  }

  const sliders: { key: keyof WorkerEvalInput; label: string; weight: number }[] = [
    { key: 'attendanceRaw', label: 'Attendance', weight: EVAL_WEIGHTS.attendance },
    { key: 'productivityRaw', label: 'Productivity', weight: EVAL_WEIGHTS.productivity },
    { key: 'qualityRaw', label: 'Quality', weight: EVAL_WEIGHTS.quality },
    { key: 'disciplineRaw', label: 'Discipline', weight: EVAL_WEIGHTS.discipline },
    { key: 'teamworkRaw', label: 'Teamwork', weight: EVAL_WEIGHTS.teamwork },
    { key: 'safetyRaw', label: 'Safety Compliance', weight: EVAL_WEIGHTS.safety },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Worker Monthly Evaluation</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="input">
          <option value="">Select worker…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}
        </select>
        <input type="number" value={year} onChange={e => setYear(+e.target.value)} className="input" />
        <select value={month} onChange={e => setMonth(+e.target.value)} className="input">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-600">{s.label} <span className="text-slate-400">({s.weight}%)</span></span>
              <span className="font-mono text-slate-500">{input[s.key]}/100</span>
            </div>
            <input
              type="range" min={0} max={100} value={input[s.key]}
              onChange={e => setInput(f => ({ ...f, [s.key]: +e.target.value }))}
              className="w-full accent-blue-600"
            />
          </div>
        ))}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm text-slate-500">Total Score (auto-calculated)</p>
            <p className="text-3xl font-bold text-slate-800">{result.total_score}<span className="text-base text-slate-400"> /100</span></p>
          </div>
          <Badge text={levelInfo.en} color={levelInfo.color} />
        </div>

        <button
          onClick={save} disabled={saving || !employeeId}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Evaluation'}
        </button>
      </div>
    </div>
  );
}

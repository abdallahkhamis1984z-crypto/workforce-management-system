import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { Employee, ShiftType, EmploymentStatus } from '../../types';

const EMPTY: Partial<Employee> = {
  employee_code: '', full_name: '', position: '', shift: 'morning',
  employment_status: 'active', hiring_date: new Date().toISOString().slice(0, 10),
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const [form, setForm] = useState<Partial<Employee>>(EMPTY);
  const [departments, setDepartments] = useState<{ id: string; name_ar: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('departments').select('id,name_ar').then(({ data }) => setDepartments(data ?? []));
    if (!isNew && id) {
      supabase.from('employees').select('*').eq('id', id).single()
        .then(({ data }) => data && setForm(data as Employee));
    }
  }, [id, isNew]);

  function update<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (isNew) {
      await supabase.from('employees').insert(form);
    } else {
      await supabase.from('employees').update(form).eq('id', id);
    }
    setSaving(false);
    nav('/employees');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">{isNew ? 'Add Employee' : 'Edit Employee'}</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <Field label="Employee Code">
          <input required value={form.employee_code ?? ''} onChange={e => update('employee_code', e.target.value)} className="input" />
        </Field>
        <Field label="Full Name">
          <input required value={form.full_name ?? ''} onChange={e => update('full_name', e.target.value)} className="input" />
        </Field>
        <Field label="Department">
          <select required value={form.department_id ?? ''} onChange={e => update('department_id', e.target.value)} className="input">
            <option value="">—</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
          </select>
        </Field>
        <Field label="Position">
          <input required value={form.position ?? ''} onChange={e => update('position', e.target.value)} className="input" />
        </Field>
        <Field label="Hiring Date">
          <input type="date" required value={form.hiring_date ?? ''} onChange={e => update('hiring_date', e.target.value)} className="input" />
        </Field>
        <Field label="Shift">
          <select value={form.shift ?? 'morning'} onChange={e => update('shift', e.target.value as ShiftType)} className="input">
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </Field>
        <Field label="Employment Status">
          <select value={form.employment_status ?? 'active'} onChange={e => update('employment_status', e.target.value as EmploymentStatus)} className="input">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="on_leave">On Leave</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </Field>
        <div className="col-span-full flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => nav('/employees')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

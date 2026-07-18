import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabaseClient';

type ReportKind = 'daily' | 'weekly' | 'monthly' | 'annual';

export default function Reports() {
  const [kind, setKind] = useState<ReportKind>('monthly');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  async function fetchReportRows() {
    // Each report kind maps to a date range; a Postgres RPC (recommended) or
    // client-side range query both work — shown here as a range query for clarity.
    const { from, to } = dateRangeFor(kind, date);
    const { data } = await supabase
      .from('attendance_records')
      .select('record_date, status, permission_hours, overtime_hours, late_minutes, employees(full_name, employee_code)')
      .gte('record_date', from)
      .lte('record_date', to);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]) ?? [];
  }

  async function exportExcel() {
    setBusy(true);
    const rows = await fetchReportRows();
    const sheetData = rows.map(r => ({
      'Employee Code': r.employees?.employee_code,
      'Employee Name': r.employees?.full_name,
      Date: r.record_date,
      Status: r.status,
      'Permission (h)': r.permission_hours,
      'Overtime (h)': r.overtime_hours,
      'Late (min)': r.late_minutes,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kind);
    XLSX.writeFile(wb, `report_${kind}_${date}.xlsx`);
    setBusy(false);
  }

  async function exportPdf() {
    setBusy(true);
    const rows = await fetchReportRows();
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Workforce Report — ${kind.toUpperCase()} — ${date}`, 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Code', 'Name', 'Date', 'Status', 'Permission (h)', 'Overtime (h)', 'Late (min)']],
      body: rows.map(r => [
        r.employees?.employee_code, r.employees?.full_name, r.record_date,
        r.status, r.permission_hours, r.overtime_hours, r.late_minutes,
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`report_${kind}_${date}.pdf`);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Reports</h1>
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Report Type</span>
          <select value={kind} onChange={e => setKind(e.target.value as ReportKind)} className="input">
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="annual">Annual Report</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Reference Date</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={exportExcel} disabled={busy} className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">
            {busy ? '…' : 'Export Excel'}
          </button>
          <button onClick={exportPdf} disabled={busy} className="flex-1 rounded-lg bg-red-600 py-2.5 font-semibold text-white disabled:opacity-50">
            {busy ? '…' : 'Export PDF'}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Includes attendance, leaves, permissions, overtime, productivity and evaluation scores
          for the selected period, per employee.
        </p>
      </div>
    </div>
  );
}

function dateRangeFor(kind: ReportKind, ref: string): { from: string; to: string } {
  const d = new Date(ref);
  if (kind === 'daily') return { from: ref, to: ref };
  if (kind === 'weekly') {
    const start = new Date(d); start.setDate(d.getDate() - d.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { from: iso(start), to: iso(end) };
  }
  if (kind === 'monthly') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: iso(start), to: iso(end) };
  }
  // annual
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  return { from: iso(start), to: iso(end) };
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StatCard } from '../../components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { AttendanceRecord } from '../../types';

export default function ProductionDashboard() {
  const [today, setToday] = useState<AttendanceRecord[]>([]);
  const [byDept, setByDept] = useState<{ name: string; present: number; absent: number }[]>([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    supabase.from('attendance_records').select('*').eq('record_date', todayStr)
      .then(({ data }) => setToday((data as AttendanceRecord[]) ?? []));

    // Department-level rollup — in production this would use a Postgres view/RPC;
    // simplified client-side aggregation shown here for clarity.
    supabase.rpc('department_attendance_today').then(({ data }) => {
      if (data) setByDept(data as { name: string; present: number; absent: number }[]);
    });
  }, []);

  const present = today.filter(r => r.status === 'present').length;
  const absent = today.filter(r => r.status === 'absent').length;
  const leave = today.filter(r => ['annual_leave', 'sick_leave', 'casual_leave'].includes(r.status)).length;
  const otHours = today.reduce((s, r) => s + (r.overtime_hours || 0), 0);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Production Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present Today" value={present} accent="green" />
        <StatCard label="Absent Today" value={absent} accent="red" />
        <StatCard label="On Leave" value={leave} accent="amber" />
        <StatCard label="Overtime Hours" value={otHours} accent="blue" />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Attendance by Department (Today)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byDept}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#16a34a" name="Present" />
            <Bar dataKey="absent" fill="#dc2626" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

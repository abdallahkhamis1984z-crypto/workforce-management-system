import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StatCard } from '../../components/ui/StatCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function HRDashboard() {
  const [trend, setTrend] = useState<{ month: string; absenteeism_pct: number }[]>([]);
  const [ranking, setRanking] = useState<{ full_name: string; total_score: number }[]>([]);

  useEffect(() => {
    // Both would be Postgres RPC functions / views in production; stubbed shape shown here.
    supabase.rpc('absenteeism_trend_12m').then(({ data }) => data && setTrend(data));
    supabase.from('worker_evaluations')
      .select('total_score, employees(full_name)')
      .order('total_score', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setRanking(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data as any[]).map(d => ({ full_name: d.employees?.full_name ?? '—', total_score: d.total_score })),
          );
        }
      });
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">HR Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Avg. Attendance" value="94.2%" accent="green" />
        <StatCard label="Avg. Absenteeism" value="5.8%" accent="red" />
        <StatCard label="Open Leave Requests" value={12} accent="amber" />
        <StatCard label="Active Employees" value={512} accent="blue" />
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Absenteeism Trend (12 Months)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" /><YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="absenteeism_pct" stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Top 10 Employee Ranking (This Month)</h2>
        <ol className="divide-y divide-slate-100">
          {ranking.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <span className="text-slate-700">#{i + 1} {r.full_name}</span>
              <span className="font-bold text-blue-600">{r.total_score}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

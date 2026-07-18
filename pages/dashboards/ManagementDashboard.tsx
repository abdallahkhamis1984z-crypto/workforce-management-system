import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabaseClient';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function ManagementDashboard() {
  const [deptRanking, setDeptRanking] = useState<{ dept: string; score: number }[]>([]);

  useEffect(() => {
    supabase.rpc('department_performance_ranking').then(({ data }) => data && setDeptRanking(data));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Management Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overall OEE" value="82.4%" accent="blue" />
        <StatCard label="Manpower Utilization" value="91.0%" accent="green" />
        <StatCard label="Avg. Supervisor Score" value="87.5" accent="amber" />
        <StatCard label="YTD Turnover" value="4.1%" accent="red" />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-700">Department Performance Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={deptRanking}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dept" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Year-end comparison across departments, supervisors and individual workers is available in
        <span className="font-semibold"> Reports → Annual Report</span>, with automatic ranking
        computed via <code>rankByAverageScore()</code> in <code>src/lib/calculations.ts</code>.
      </p>
    </div>
  );
}

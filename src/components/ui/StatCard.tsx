interface StatCardProps {
  label: string;
  value: string | number;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'gray';
  icon?: React.ReactNode;
}

const ACCENTS: Record<string, string> = {
  blue: 'border-blue-500 text-blue-600 bg-blue-50',
  green: 'border-emerald-500 text-emerald-600 bg-emerald-50',
  red: 'border-red-500 text-red-600 bg-red-50',
  amber: 'border-amber-500 text-amber-600 bg-amber-50',
  gray: 'border-slate-400 text-slate-600 bg-slate-50',
};

export function StatCard({ label, value, accent = 'blue', icon }: StatCardProps) {
  return (
    <div className={`rounded-xl border-s-4 bg-white p-4 shadow-sm ${ACCENTS[accent]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        {icon && <div className="text-3xl opacity-70">{icon}</div>}
      </div>
    </div>
  );
}

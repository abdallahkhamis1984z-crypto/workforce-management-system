interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns, rows, emptyLabel = 'No data',
}: { columns: Column<T>[]; rows: T[]; emptyLabel?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-max text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 text-start font-semibold">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">{emptyLabel}</td></tr>
          )}
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50">
              {columns.map((c, i) => <td key={i} className="whitespace-nowrap px-4 py-3">{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

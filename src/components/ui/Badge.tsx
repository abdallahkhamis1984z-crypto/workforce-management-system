export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );
}

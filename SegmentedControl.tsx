export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex bg-surface border border-border rounded-2xl p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex-1 text-center py-2.5 rounded-xl text-[13px] transition-colors ${
            value === option
              ? "bg-sage text-white font-semibold"
              : "text-ink-soft"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

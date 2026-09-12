export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-chip text-[13px] transition-colors ${
        selected
          ? "bg-sage-tint text-sage font-semibold border border-sage"
          : "bg-surface text-ink-soft border border-border"
      }`}
    >
      {label}
    </button>
  );
}

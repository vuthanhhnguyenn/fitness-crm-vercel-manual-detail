interface FeeCurrentBadgeProps {
  status?: 'active' | 'inactive';
  showDot?: boolean;
}

export function FeeCurrentBadge({ status = 'active', showDot = false }: FeeCurrentBadgeProps) {
  const isInactive = status === 'inactive';

  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 py-0 text-[10px] font-medium ${
        isInactive
          ? 'border-warning/20 bg-warning/15 text-warning'
          : 'border-success/20 bg-success/15 text-success'
      }`}
    >
      {showDot ? (
        <span className={`size-1.5 rounded-full ${isInactive ? 'bg-warning' : 'bg-success'}`} />
      ) : null}
      {isInactive ? '無効' : '現行'}
    </span>
  );
}

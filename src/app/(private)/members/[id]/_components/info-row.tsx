export default function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1">{value ?? '—'}</p>
    </div>
  );
}

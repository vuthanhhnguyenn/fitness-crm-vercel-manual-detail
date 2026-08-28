export function RequiredMark() {
  return <span className="text-destructive ml-0.5 text-xs">*</span>;
}

export function OptionalMark() {
  return (
    <span className="text-muted-foreground ml-1 rounded-sm border px-1 text-[10px] leading-relaxed">
      任意
    </span>
  );
}

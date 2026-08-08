interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = "🚕", title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
      <div className="glass-card mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] text-3xl">
        {icon}
      </div>
      <p className="text-[15px] font-bold tracking-tight text-ink">{title}</p>
      {subtitle && (
        <p className="mt-1 max-w-[260px] text-[13px] leading-relaxed text-text-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}

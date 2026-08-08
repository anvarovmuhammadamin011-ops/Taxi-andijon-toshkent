import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={() => navigate("/admin")} />
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-text-2">{subtitle}</p>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent?: string;
  icon?: string;
}) {
  return (
    <div className="glass-card rounded-xl2 p-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-2">{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold" style={{ color: accent ?? "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

export function AdminRow({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl2 p-4 animate-fade-in-up">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-text-2">{subtitle}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function BarChart({ data }: { data: { date: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className="w-full rounded-t bg-primary/70 transition-all duration-300 group-hover:bg-primary"
            style={{ height: `${Math.max(6, (d.amount / max) * 100)}%` }}
            title={`${d.date}: ${d.amount.toLocaleString()} so'm`}
          />
        </div>
      ))}
    </div>
  );
}

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./BackButton";
import { telegram } from "../lib/telegram";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
}

export default function PageHeader({ title, subtitle, onBack, trailing }: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    telegram.haptic("light");
    if (onBack) onBack();
    else if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={goBack} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-xs text-text-2">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

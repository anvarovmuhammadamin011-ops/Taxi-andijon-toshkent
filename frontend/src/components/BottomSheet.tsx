import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Yopish"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fade-in"
      />
      <div className="relative w-full max-w-md animate-slide-up rounded-t-[36px] glass pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="grabber mx-auto mt-2.5" />
        {title && (
          <p className="px-6 pb-2 pt-4 text-[17px] font-bold text-ink">{title}</p>
        )}
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}

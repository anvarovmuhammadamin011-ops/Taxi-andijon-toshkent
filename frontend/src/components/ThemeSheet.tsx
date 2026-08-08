import BottomSheet from "./BottomSheet";
import { useTheme, type ThemeMode } from "../context/ThemeContext";
import { CheckIcon } from "./Icons";
import { telegram } from "../lib/telegram";

const options: { id: ThemeMode; label: string; desc: string }[] = [
  { id: "light", label: "Yorug'", desc: "Yorqin va yengil ko'rinish" },
  { id: "dark", label: "Qorong'i", desc: "Qulay tungi ko'rinish" },
  { id: "system", label: "Tizim", desc: "Telefon sozlamasiga mos" },
];

export default function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useTheme();

  return (
    <BottomSheet open={open} onClose={onClose} title="Tashqi ko'rinish">
      <div className="space-y-2 pb-2">
        {options.map((o) => {
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              onClick={() => {
                telegram.haptic("light");
                setMode(o.id);
              }}
              className={`press flex w-full items-center gap-3 rounded-[16px] border p-4 text-left transition-colors duration-300 ${
                active ? "border-primary bg-primary/10" : "border-line bg-card-2"
              }`}
            >
              <span className="flex-1">
                <span className={`block text-[15px] font-semibold ${active ? "text-primary" : "text-ink"}`}>
                  {o.label}
                </span>
                <span className="block text-[12.5px] text-text-2">{o.desc}</span>
              </span>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <CheckIcon className="h-3.5 w-3.5 text-black" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

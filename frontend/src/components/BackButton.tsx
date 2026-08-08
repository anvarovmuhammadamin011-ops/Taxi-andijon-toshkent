import { BackIcon } from "./Icons";
import { telegram } from "../lib/telegram";

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => {
        telegram.haptic("light");
        onClick();
      }}
      aria-label="Orqaga"
      className="press glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"
    >
      <BackIcon className="h-5 w-5" />
    </button>
  );
}

import { useRef } from "react";
import { SearchIcon } from "./Icons";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ value, onChange, placeholder, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="press flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3 border border-line shadow-soft"
      onClick={() => inputRef.current?.focus()}
    >
      <SearchIcon className="h-5 w-5 shrink-0 text-text-2" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Qidirish..."}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-[15px] text-ink placeholder:text-text-2 outline-none"
      />
      {value && (
        <button
          className="text-xs font-semibold text-text-2 active:opacity-60"
          onClick={() => onChange("")}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function Splash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg safe-top safe-bottom">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full tile-gradient shadow-soft animate-scale-in">
        <img src="/logo.png" alt="Taxi Collector" className="h-full w-full object-cover" />
      </div>

      <h1 className="mt-6 animate-fade-in-up text-2xl font-bold tracking-[0.18em] text-ink">
        TAXI&nbsp;COLLECTOR
      </h1>
      <p
        className="mt-2 animate-fade-in-up text-[13px] font-medium text-text-2"
        style={{ animationDelay: "0.15s" }}
      >
        Toshkent ↔ Andijon
      </p>
    </div>
  );
}

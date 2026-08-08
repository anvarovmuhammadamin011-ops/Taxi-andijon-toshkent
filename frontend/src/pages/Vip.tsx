import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon, CrownIcon } from "../components/Icons";
import PageHeader from "../components/PageHeader";
import { telegram } from "../lib/telegram";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../lib/format";

const features = [
  "Yangi e'lonlardan darhol xabar",
  "Cheksiz qidiruv",
  "VIP badge",
  "Reklamasiz foydalanish",
];

export default function Vip() {
  const navigate = useNavigate();
  const { config, profile } = useData();
  const { show } = useToast();
  const plans = config.plans;
  const [selected, setSelected] = useState(plans[1]?.id ?? plans[0]?.id ?? "");

  const goBack = () => {
    telegram.haptic("light");
    navigate(-1);
  };

  useEffect(() => {
    telegram.showBackButton(goBack);
    return () => telegram.hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = () => {
    telegram.haptic("medium");
    telegram.notify("success");
    show("VIP obuna faollashtirildi", "👑");
  };

  const selectedPlan = plans.find((p) => p.id === selected);

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <PageHeader title="VIP obuna" onBack={goBack} />

        <div className="relative mt-5 overflow-hidden rounded-[24px] vip-gradient p-6 shadow-soft animate-scale-in">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary shadow-glow">
              <CrownIcon className="h-6 w-6 text-black" />
            </span>
            <div>
              <h2 className="text-[20px] font-extrabold text-ink">
                <span className="text-primary">VIP</span> bo'lish
              </h2>
              <p className="text-[12.5px] text-text-2">Cheksiz imkoniyatlar · {profile.name}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {features.map((f, i) => (
            <div
              key={f}
              className="glass-card flex items-center gap-2.5 rounded-[16px] px-3.5 py-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <CheckIcon className="h-3 w-3 text-primary" />
              </span>
              <span className="text-[12.5px] font-medium leading-snug text-ink/90">{f}</span>
            </div>
          ))}
        </div>

        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-text-2">
          Muddatni tanlang
        </p>
        <div className="space-y-2.5">
          {plans.map((plan, i) => {
            const active = plan.id === selected;
            return (
              <button
                key={plan.id}
                onClick={() => {
                  telegram.haptic("light");
                  setSelected(plan.id);
                }}
                className={`press glass-card flex w-full items-center gap-3 rounded-[18px] border p-4 text-left transition-all duration-300 animate-fade-in-up ${
                  active
                    ? "border-primary shadow-glow"
                    : "border-line"
                }`}
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    active ? "border-primary" : "border-card-hi"
                  }`}
                >
                  {active && <span className="h-3 w-3 rounded-full bg-primary" />}
                </span>
                <div className="flex-1">
                  <p className={`text-[15px] font-bold ${active ? "text-primary" : "text-ink"}`}>
                    {plan.period}
                  </p>
                  <p className="text-[12px] text-text-2">
                    {formatMoney(plan.price)} so'm
                  </p>
                </div>
                {active && <CrownIcon className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={subscribe}
          className="press btn-primary mt-5 flex w-full items-center justify-center gap-2 py-4 text-[15px] font-bold"
        >
          <CrownIcon className="h-5 w-5" />
          {selectedPlan
            ? `VIP ${selectedPlan.period.toLowerCase()} — ${formatMoney(selectedPlan.price)} so'm`
            : "Obuna bo'lish"}
        </button>

        <p className="mt-4 text-center text-[11px] text-text-2">
          To'lov Telegram orqali xavfsiz amalga oshiriladi
        </p>
      </div>
    </div>
  );
}

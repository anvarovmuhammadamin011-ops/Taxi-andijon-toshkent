import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { dateLabel, displayPhone, normalizePhone, routeKey } from "../lib/format";
import { telegram } from "../lib/telegram";
import { HeartIcon, IdIcon, PhoneIcon, PinIcon, UserIcon } from "../components/Icons";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { getPost, toggleFavorite, isFavorite } = useData();
  const { show } = useToast();
  const navigate = useNavigate();
  const post = getPost(id ?? "");
  const fav = isFavorite(post?.id ?? "");

  const goBack = () => {
    telegram.haptic("light");
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  useEffect(() => {
    telegram.showBackButton(goBack);
    return () => telegram.hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!post) {
    return (
      <div className="no-scrollbar h-full overflow-y-auto px-4 pb-24 pt-4 safe-top">
        <PageHeader title="E'lon tafsiloti" onBack={goBack} />
        <EmptyState title="E'lon topilmadi" subtitle="E'lon o'chirilgan bo'lishi mumkin" />
      </div>
    );
  }

  const onFavorite = () => {
    telegram.haptic("light");
    const next = !fav;
    toggleFavorite(post.id);
    show(next ? "Saqlanganlarga qo'shildi" : "Saqlanganlardan olib tashlandi", next ? "♥" : undefined);
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-28 pt-4 safe-top">
      <PageHeader title="E'lon tafsiloti" onBack={goBack} />

      <div className="glass-card mt-4 overflow-hidden rounded-xl3 animate-scale-in">
        {post.image && <img src={post.image} alt="" className="h-56 w-full object-cover" />}

        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="tile-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl shadow-soft">
              🚕
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-ink">{post.channelTitle}</p>
              <p className="text-xs text-text-2">{dateLabel(post.postedAt)}</p>
            </div>
            <button
              onClick={onFavorite}
              className="press glass-chip flex h-10 w-10 items-center justify-center rounded-full border border-line"
              aria-label="Saqlash"
            >
              <HeartIcon
                filled={fav}
                className={`h-5 w-5 transition-all duration-200 ${
                  fav ? "scale-110 text-primary" : "text-text-2"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {post.seats != null && (
              <span className="glass-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink/80">
                🪑 {post.seats} ta joy
              </span>
            )}
            {post.alsoIn.length > 0 && (
              <span className="rounded-full border border-line bg-card-hi px-2.5 py-1 text-[11px] font-medium text-text-2">
                Yana {post.alsoIn.length} kanalda
              </span>
            )}
          </div>

          <p className="mt-4 text-[17px] font-medium leading-relaxed text-ink">{post.text}</p>

          <div className="mt-4 space-y-2.5">
            {post.driverName && (
              <p className="flex items-center gap-2.5 text-[14px] text-text-2">
                <UserIcon className="h-4 w-4 text-text-2" />
                <span className="font-medium text-ink/90">{post.driverName}</span>
              </p>
            )}
            <p className="flex items-center gap-2.5 text-[14px] text-text-2">
              <IdIcon className="h-4 w-4 text-text-2" />
              <span className="font-medium text-ink/90">🆔 {post.messageId}</span>
            </p>
            {post.phone && (
              <p className="flex items-center gap-2.5 text-[14px] text-text-2">
                <PhoneIcon className="h-4 w-4 text-text-2" />
                <span className="font-medium text-ink/90">{displayPhone(post.phone)}</span>
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-card-hi px-3 py-2.5 text-[13px] text-text-2">
            <PinIcon className="h-4 w-4 shrink-0 text-text-2" />
            <span>
              {post.channelTitle} | {routeKey(post.from, post.to)}
            </span>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              onClick={() => {
                telegram.haptic("medium");
                if (!post.phone) {
                  show("Telefon raqami topilmadi");
                  return;
                }
                telegram.notify("success");
                telegram.call(normalizePhone(post.phone));
              }}
              className="press btn-primary flex w-full items-center justify-center gap-2 py-4 text-[15px] font-bold"
            >
              <PhoneIcon className="h-5 w-5" />
              Haydovchiga qo'ng'iroq qilish
              {post.phone && <span className="text-[13px] font-semibold text-black/70">· {displayPhone(post.phone)}</span>}
            </button>
            {!post.phone && (
              <p className="text-center text-xs text-text-2">Ushbu e'londa telefon raqami aniqlanmadi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

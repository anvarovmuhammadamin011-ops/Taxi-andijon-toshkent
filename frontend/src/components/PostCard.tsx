import { Link } from "react-router-dom";
import { Post } from "../types";
import { displayPhone, isNewPost, normalizePhone, routeKey, timeAgo } from "../lib/format";
import { telegram } from "../lib/telegram";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { HeartIcon, UserIcon } from "./Icons";

interface Props {
  post: Post;
  index?: number;
}

export default function PostCard({ post, index = 0 }: Props) {
  const { routes, toggleFavorite, isFavorite } = useData();
  const { show } = useToast();
  const delay = Math.min(index * 55, 400);
  const fav = isFavorite(post.id);
  const isNew = isNewPost(post.postedAt);
  const routeColor =
    routes.find((r) => routeKey(r.from, r.to) === routeKey(post.from, post.to))?.color ?? "var(--accent)";

  const call = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    telegram.haptic("medium");
    if (!post.phone) {
      show("Telefon raqami topilmadi");
      return;
    }
    telegram.notify("success");
    telegram.call(normalizePhone(post.phone));
  };

  const onFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    telegram.haptic("light");
    const next = !fav;
    toggleFavorite(post.id);
    show(next ? "Saqlanganlarga qo'shildi" : "Saqlanganlardan olib tashlandi", next ? "♥" : undefined);
  };

  return (
    <Link
      to={`/post/${post.id}`}
      className="glass-card block rounded-[20px] p-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink/90">
          {post.channelTitle}
        </p>
        {isNew && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            Yangi
          </span>
        )}
        <p className="shrink-0 text-[11px] font-medium text-text-2">{timeAgo(post.postedAt)}</p>
      </div>

      <p className="mt-3 text-[16px] font-medium leading-relaxed text-ink">
        {post.text}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {post.seats != null && (
          <span className="flex items-center gap-1.5 rounded-full glass-chip px-2.5 py-1 text-[11px] font-bold text-ink/80">
            🪑 {post.seats} ta joy
          </span>
        )}
        {post.phone && (
          <span className="rounded-full border border-line bg-card-hi px-2.5 py-1 text-[11px] font-medium text-ink/70">
            📞 {displayPhone(post.phone)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
        {post.driverName && (
          <p className="flex items-center gap-2 text-[12.5px] text-text-2">
            <UserIcon className="h-3.5 w-3.5 text-text-2" />
            <span className="font-medium text-ink/80">{post.driverName}</span>
          </p>
        )}
        <p className="flex items-center gap-2 text-[12.5px] text-text-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: routeColor }}
          />
          <span className="truncate font-medium text-ink/80">
            {post.from} → {post.to}
          </span>
          {post.alsoIn.length > 0 && (
            <span className="ml-auto shrink-0 text-[10.5px] text-text-2">
              +{post.alsoIn.length} kanalda
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={call}
          className="press btn-primary flex flex-1 items-center justify-center gap-2 py-3.5 text-[14px] font-bold"
        >
          📞 Qo'ng'iroq qilish
        </button>
        <button
          onClick={onFavorite}
          aria-label="Saqlash"
          className="press glass-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-line"
        >
          <HeartIcon
            filled={fav}
            className={`h-5 w-5 transition-all duration-200 ${
              fav ? "text-primary" : "text-text-2"
            } ${fav ? "animate-heart-pop" : ""}`}
          />
        </button>
      </div>
    </Link>
  );
}

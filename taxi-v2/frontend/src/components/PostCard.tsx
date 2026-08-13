import { Post } from '../lib/types';
import { routeLabel } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../lib/format';

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const { savedIds, toggleSaved } = useAuth();
  const isSaved = savedIds.includes(post.id);
  const isNew = Date.now() - new Date(post.collectedAt).getTime() < 3 * 60000;
  const text = cleanText(post.originalText);

  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)]">
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
          {routeLabel(post.route)}
        </span>
        {isNew ? (
          <span className="text-[10px] font-semibold text-[var(--green)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" /> Yangi
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-secondary)]">{timeAgo(post.collectedAt)}</span>
        )}
      </div>

      {/* Matn */}
      <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">{text}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        {post.passengerCount ? <span>👥 {post.passengerCount} kishi</span> : null}
        <span>📍 {post.channelTitle}</span>
      </div>

      {/* Amallar */}
      <div className="flex items-center gap-2 mt-3">
        {post.phone && (
          <a
            href={`tel:+998${post.phone}`}
            className="flex-1 bg-[var(--green)] text-white font-semibold py-2.5 rounded-xl text-center text-sm"
          >
            📞 Bog&apos;lanish
          </a>
        )}
        <button
          onClick={() => toggleSaved(post)}
          className="w-11 h-11 shrink-0 rounded-xl border border-[var(--border)] flex items-center justify-center text-lg"
          aria-label="Saqlash"
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  );
}

import { Post } from '../lib/types';
import { routeLabel } from '../lib/types';
import { useAuth } from '../context/AuthContext';

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const { savedIds, toggleSaved } = useAuth();
  const isSaved = savedIds.includes(post.id);

  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium">
          {routeLabel(post.route)}
        </span>
        <div className="flex items-center gap-2">
          {post.passengerCount && (
            <span className="text-xs text-[var(--text-secondary)]">
              👥 {post.passengerCount} kishi
            </span>
          )}
          <button
            onClick={() => toggleSaved(post)}
            className="text-lg leading-none"
            aria-label="Save"
          >
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
        {post.originalText}
      </p>

      {post.phone && (
        <a
          href={`tel:+998${post.phone}`}
          className="mt-3 flex items-center justify-center gap-2 bg-[var(--green)] text-white font-semibold py-2.5 rounded-xl"
        >
          📞 Qo'ng'iroq qilish
        </a>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{post.channelTitle}</span>
        <span>{new Date(post.collectedAt).toLocaleTimeString('uz-UZ')}</span>
      </div>
    </div>
  );
}
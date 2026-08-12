import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function SavedPage() {
  const { savedPosts } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-3">
          <h1 className="font-bold text-lg">Saqlanganlar</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {savedPosts.length} ta saqlangan e'lon
          </p>
        </div>
      </header>

      <main className="p-4 space-y-3">
        {savedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">❤️</p>
            <p className="text-[var(--text-secondary)]">Hali saqlangan e'lonlar yo'q</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-xl"
            >
              E'lonlarni ko'rish
            </button>
          </div>
        ) : (
          savedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {savedPosts.length > 0 && (
          <p className="text-center text-xs text-[var(--text-secondary)] pt-2">
            Post o'chib ketgan bo'lsa, kartochka avtomatik yashirinadi
          </p>
        )}
      </main>
    </div>
  );
}
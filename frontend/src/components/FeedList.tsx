import { Post } from "../types";
import PostCard from "./PostCard";
import EmptyState from "./EmptyState";
import { FeedSkeleton } from "./Skeletons";

interface Props {
  posts: Post[];
  loading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function FeedList({
  posts,
  loading,
  skeletonCount = 4,
  emptyTitle = "E'lonlar topilmadi",
  emptySubtitle = "Qidiruv so'zini o'zgartirib ko'ring yoki boshqa yo'nalishni tanlang",
}: Props) {
  if (loading) return <FeedSkeleton count={skeletonCount} />;

  if (posts.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}

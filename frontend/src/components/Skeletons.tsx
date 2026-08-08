export function PostCardSkeleton() {
  return (
    <div className="glass-card rounded-xl2 p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-1/2" />
          <div className="skeleton h-2.5 w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-11 flex-1 rounded-xl" />
        <div className="skeleton h-11 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

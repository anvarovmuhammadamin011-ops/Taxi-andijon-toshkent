import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import FeedList from "../components/FeedList";
import PageHeader from "../components/PageHeader";
import { routeKey } from "../lib/format";
import { telegram } from "../lib/telegram";
import EmptyState from "../components/EmptyState";

export default function RouteFeed() {
  const { from = "", to = "" } = useParams<{ from: string; to: string }>();
  const { visiblePosts, loading } = useData();
  const navigate = useNavigate();

  const goBack = () => {
    telegram.haptic("light");
    navigate("/routes");
  };

  useEffect(() => {
    telegram.showBackButton(goBack);
    return () => telegram.hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(
    () =>
      visiblePosts
        .filter((p) => routeKey(p.from, p.to) === routeKey(from, to))
        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [visiblePosts, from, to]
  );

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
      <div className="px-4 pt-4 safe-top">
        <PageHeader
          title={`${from} → ${to}`}
          subtitle={`${loading ? "…" : list.length} ta e'lon`}
          onBack={goBack}
        />

        <div className="mt-4">
          {list.length === 0 && !loading ? (
            <EmptyState
              title="Bu yo'nalishda e'lonlar yo'q"
              subtitle="Keyinroq qaytib ko'ring — e'lonlar doim yangilanadi"
            />
          ) : (
            <FeedList posts={list} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

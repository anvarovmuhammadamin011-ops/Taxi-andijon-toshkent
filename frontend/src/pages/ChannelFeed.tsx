import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import FeedList from "../components/FeedList";
import PageHeader from "../components/PageHeader";
import { telegram } from "../lib/telegram";
import EmptyState from "../components/EmptyState";

export default function ChannelFeed() {
  const { id = "" } = useParams<{ id: string }>();
  const { posts, channels, loading } = useData();
  const navigate = useNavigate();
  const channel = channels.find((c) => c.id === id);

  const goBack = () => {
    telegram.haptic("light");
    navigate("/channels");
  };

  useEffect(() => {
    telegram.showBackButton(goBack);
    return () => telegram.hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(
    () =>
      posts
        .filter((p) => p.channelId === id)
        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [posts, id]
  );

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-24">
      <div className="px-4 pt-4 safe-top">
        <PageHeader
          title={channel?.title ?? "Kanallar"}
          subtitle={`${loading ? "…" : list.length} ta e'lon`}
          onBack={goBack}
          trailing={
            <div className="tile-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg shadow-soft">
              🚕
            </div>
          }
        />

        <div className="mt-4">
          {list.length === 0 && !loading ? (
            <EmptyState
              title="Bu kanalda hali e'lonlar yo'q"
              subtitle="Yangi e'lonlar chiqishi bilan shu yerda ko'rinadi"
            />
          ) : (
            <FeedList posts={list} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

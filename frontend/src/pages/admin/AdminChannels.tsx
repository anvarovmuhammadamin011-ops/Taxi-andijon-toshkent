import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Channel } from "../../types";
import { AdminHeader } from "./AdminUi";
import { telegram } from "../../lib/telegram";
import { FeedSkeleton } from "../../components/Skeletons";
import { PauseIcon, PlayIcon, PlusIcon, TrashIcon } from "../../components/Icons";

export default function AdminChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const load = () =>
    api.admin.channels().then((r) => {
      if (r.ok) setChannels(r.data);
      setLoading(false);
    });

  useEffect(() => {
    void load();
  }, []);

  const add = () => {
    if (!title.trim() || !url.trim()) {
      telegram.notify("warning");
      return;
    }
    telegram.haptic("light");
    void api.admin.addChannel(title.trim(), url.trim()).then((r) => {
      if (r.ok) {
        setTitle("");
        setUrl("");
        void load();
        telegram.notify("success");
      }
    });
  };

  const toggle = (ch: Channel) => {
    telegram.haptic("light");
    void api.admin.toggleChannel(ch.id, !ch.isActive).then(() => load());
  };

  const remove = (ch: Channel) => {
    telegram.haptic("medium");
    void api.admin.deleteChannel(ch.id).then(() => load());
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-28">
      <div className="px-4 pt-4 safe-top">
        <AdminHeader title="Kanallar" subtitle="Collector manbalarini boshqarish" />

        <div className="mt-4 rounded-xl2 border border-line bg-card p-4 shadow-soft animate-fade-in-up">
          <p className="text-[15px] font-bold text-ink">+ Kanal qo'shish</p>
          <div className="mt-3 space-y-2.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kanal nomi (Norin Taxi)"
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Channel username (@norintaxi)"
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink placeholder:text-text-2 outline-none focus:border-primary"
            />
            <button
              onClick={add}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black"
            >
              <PlusIcon className="h-4 w-4" />
              Qo'shish
            </button>
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <FeedSkeleton count={3} />
          ) : (
            <div className="space-y-3">
              {channels.map((ch, i) => (
                <div
                  key={ch.id}
                  className={`rounded-xl2 border bg-card p-4 shadow-soft animate-fade-in-up ${
                    ch.isActive ? "border-line" : "border-error/30 opacity-70"
                  }`}
                  style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-ink">{ch.title}</p>
                      <p className="text-xs text-text-2">
                        {ch.postCount} ta e'lon · {ch.url}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        ch.isActive ? "bg-success/15 text-success" : "bg-error/15 text-error"
                      }`}
                    >
                      {ch.isActive ? "Faol" : "Pauza"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => toggle(ch)}
                      className={`press flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold ${
                        ch.isActive ? "bg-card-hi text-ink" : "bg-primary text-black"
                      }`}
                    >
                      {ch.isActive ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
                      {ch.isActive ? "Pauza" : "Faollashtirish"}
                    </button>
                    <button
                      onClick={() => remove(ch)}
                      className="press flex items-center justify-center rounded-lg bg-error/15 px-4 text-xs font-bold text-error"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

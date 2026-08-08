import { useNavigate } from "react-router-dom";
import { Channel } from "../types";
import { telegram } from "../lib/telegram";
import { ChevronRightIcon } from "./Icons";

interface Props {
  channel: Channel;
  index?: number;
}

export default function ChannelCard({ channel, index = 0 }: Props) {
  const navigate = useNavigate();
  const delay = Math.min(index * 50, 300);

  return (
    <button
      onClick={() => {
        telegram.haptic("light");
        navigate(`/channel/${channel.id}`);
      }}
      className="press glass-card flex w-full items-center gap-3 rounded-[20px] p-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="tile-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl shadow-soft">
        🚕
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[15px] font-bold text-ink">
          {channel.title}
        </p>
        <p className="text-xs text-text-2">
          <span className="font-semibold text-primary">
            {channel.postCount} ta e'lon
          </span>
        </p>
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-text-2" />
    </button>
  );
}

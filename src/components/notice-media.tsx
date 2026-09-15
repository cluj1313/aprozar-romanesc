import { ExternalLink } from "lucide-react";
import type { Announcement } from "@/lib/types";

export function NoticeMedia({ notice }: { notice: Announcement }) {
  if (!notice.image && !notice.linkUrl) return null;
  const external = /^https?:\/\//i.test(notice.linkUrl);
  return (
    <div className="mt-3">
      {notice.image ? (
        notice.linkUrl ? (
          <a
            href={notice.linkUrl}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            <img src={notice.image} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
          </a>
        ) : (
          <img src={notice.image} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
        )
      ) : null}
      {notice.linkUrl ? (
        <a
          href={notice.linkUrl}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Deschide linkul
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </div>
  );
}

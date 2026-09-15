import { NoticeMedia } from "@/components/notice-media";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";
import type { Announcement } from "@/lib/types";
import { useHasHydrated } from "@/lib/use-hydrated";

export function HomeNotice({ announcements }: { announcements: Announcement[] }) {
  const hydrated = useHasHydrated();
  const silenced = useShop((s) => s.silencedNoticeIds);
  const sessionClosed = useShop((s) => s.sessionClosedNoticeIds);
  const closeNoticeSession = useShop((s) => s.closeNoticeSession);
  const silenceNotice = useShop((s) => s.silenceNotice);

  if (!hydrated) return null;

  const notice = pickHomeNotice(announcements, silenced, sessionClosed);
  if (!notice) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-fg/45 px-4 pb-8 pt-16 sm:items-center"
      role="presentation"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-notice-title"
        className="w-full max-w-md rounded-2xl border border-border bg-elevated p-5 shadow-soft"
      >
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Anunț</p>
        <h2 id="home-notice-title" className="mt-1 font-display text-xl font-semibold">
          {notice.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{notice.body}</p>
        <NoticeMedia notice={notice} />
        <Button
          type="button"
          className="mt-5 w-full rounded-xl"
          onClick={() => silenceNotice(notice.id)}
        >
          Am înțeles. Nu mai arăta anunțul
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full rounded-xl"
          onClick={() => closeNoticeSession(notice.id)}
        >
          Închide anunțul
        </Button>
      </article>
    </div>
  );
}

function pickHomeNotice(
  announcements: Announcement[],
  silenced: string[],
  sessionClosed: string[],
) {
  const silencedSet = new Set(silenced);
  const closedSet = new Set(sessionClosed);
  return announcements
    .filter((a) => a.audience === "all" && !a.hidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .find((a) => !silencedSet.has(a.id) && !closedSet.has(a.id));
}

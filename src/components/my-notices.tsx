import { useQuery } from "@tanstack/react-query";
import { NoticeMedia } from "@/components/notice-media";
import { listMyNotices } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";

export function MyNotices() {
  const session = useShop((s) => s.session);
  const contact = useShop((s) => s.contact);
  const silenced = useShop((s) => s.silencedNoticeIds);
  const producerId = session.role === "producer" ? session.producerId : null;
  const phone = session.role === "admin" ? session.phone : (contact?.phone ?? "");

  const q = useQuery({
    queryKey: ["notices", phone, producerId ?? ""],
    queryFn: () => listMyNotices({ data: { phone, producerId } }),
  });
  const items = (q.data ?? []).filter((a) => !a.hidden && !silenced.includes(a.id));
  if (!items.length) return null;

  return (
    <section className="space-y-2">
      {items.map((a) => (
        <article key={a.id} className="rounded-2xl border border-primary/20 bg-elevated px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {a.audience === "user" ? "Pentru tine" : "Anunț"}
          </p>
          <p className="font-semibold">{a.title}</p>
          <p className="mt-0.5 text-sm font-normal text-muted">{a.body}</p>
          <NoticeMedia notice={a} />
        </article>
      ))}
    </section>
  );
}

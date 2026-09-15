import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RatingBadge } from "@/components/producer-card";
import { intlPhone, waDigits } from "@/lib/order-message";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/povesti/$slug")({ component: StoryPage });

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.77.46 3.45 1.28 4.9L2 22l5.4-1.4a10 10 0 0 0 4.64 1.18h.04c5.46 0 9.89-4.4 9.89-9.84C21.97 6.4 17.5 2 12.04 2zm5.72 14.07c-.24.68-1.4 1.26-1.93 1.34-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.77-4.16-4.92-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36h.55c.17 0 .41-.07.64.49.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.2-.15.32-.3.5-.14.17-.3.38-.43.51-.14.15-.29.31-.12.6.16.29.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.29.14.45.12.62-.07.16-.2.7-.81.88-1.09.19-.27.37-.23.63-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.32.07.12.07.68-.17 1.36z"
      />
    </svg>
  );
}

function StoryPage() {
  const { slug } = Route.useParams();
  const { data } = useCatalog();
  const story = data?.stories.find((s) => s.slug === slug);
  const producer = data?.producers.find((p) => p.id === story?.producerId);
  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10 text-muted">Se încarcă…</div>
      </AppShell>
    );
  }
  if (!story || !producer) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10">Povestea nu e aici.</div>
      </AppShell>
    );
  }

  const avatar = producer.avatar || producer.image;
  const digits = waDigits(producer.phone);
  const tel = intlPhone(producer.phone);
  const waHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(`Bună, ${producer.name}! Te-am găsit pe Aprozar Românesc.`)}`
    : undefined;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pb-10">
        <div className="relative">
          <img src={producer.image} alt="" className="aspect-[3/2] w-full object-cover" />
          <div className="absolute top-2 right-3 z-10 flex gap-1.5">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${producer.name}`}
                className="flex size-11 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
              >
                <WhatsAppIcon className="size-5" />
              </a>
            ) : null}
            {tel ? (
              <a
                href={`tel:${tel}`}
                aria-label={`Sună ${producer.name} la ${tel}`}
                className="flex size-11 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
              >
                <Phone className="size-5" />
              </a>
            ) : null}
          </div>
          <img
            src={avatar}
            alt=""
            className="absolute bottom-2 left-3 size-14 rounded-full object-cover outline outline-2 outline-bg"
          />
          <RatingBadge
            rating={producer.rating}
            count={producer.ratingCount}
            className="top-auto bottom-2 left-auto right-3"
          />
        </div>
        <article className="px-4 pt-4">
          <Link to="/producatori/$id" params={{ id: producer.id }} className="text-sm font-semibold text-primary">
            {producer.name}
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">{story.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg">{story.body}</p>
          <Link to="/producatori/$id" params={{ id: producer.id }} className="mt-6 inline-block font-semibold text-primary">
            Vezi marfa de la {producer.name} →
          </Link>
        </article>
      </div>
    </AppShell>
  );
}

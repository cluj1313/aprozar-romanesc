import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { RatingBadge } from "@/components/producer-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/wa-icon";
import { SocialRow } from "@/components/social-row";
import { createMessage } from "@/lib/catalog-fns";
import { intlPhone, waDigits } from "@/lib/order-message";
import { DEFAULT_PRODUCER_SOCIAL_INTRO, pickSocial } from "@/lib/social";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/producatori/$id")({ component: ProducerPage });

function ProducerPage() {
  const { id } = Route.useParams();
  const { data } = useCatalog();
  const producer = data?.producers.find((p) => p.id === id);
  const products = (data?.products ?? [])
    .filter((p) => p.producerId === id && p.visible)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ro"));
  const story = data?.stories.find((s) => s.producerId === id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      createMessage({
        data: { producerId: id, customerName: name.trim(), customerPhone: phone.trim(), body: body.trim() },
      }),
    onSuccess: () => setSent(true),
  });

  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10 text-muted">Se încarcă…</div>
      </AppShell>
    );
  }
  if (!producer) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10">Producătorul nu e pe listă.</div>
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
      <div className="mx-auto max-w-xl pb-8">
        <div className="relative">
          <img src={producer.image} alt="" className="aspect-[2/1] w-full object-cover" />
          <RatingBadge rating={producer.rating} count={producer.ratingCount} className="top-2 left-3" />
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
        </div>
        <div className="px-4 pt-3">
          <h1 className="font-display text-2xl font-semibold">{producer.name}</h1>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5 text-primary" />
            <span className="tabular-nums">{producer.km.toLocaleString("ro-RO")} km</span>
            <span>
              · {producer.village}, {producer.county}
            </span>
          </p>
          {story ? (
            <Link to="/povesti/$slug" params={{ slug: story.slug }} className="mt-1 inline-block text-xs font-semibold text-primary">
              {story.title} →
            </Link>
          ) : null}

          <SocialRow social={pickSocial(producer)} fallbackIntro={DEFAULT_PRODUCER_SOCIAL_INTRO} />

          <h2 className="mt-5 text-base font-semibold">Marfa de azi</h2>
          <ProductGrid className="mt-2" everyFifth>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} producer={producer} />
            ))}
          </ProductGrid>

          <section className="mt-6 rounded-xl border border-border bg-elevated p-3">
            <h2 className="font-semibold">Scrie-i lui {producer.name.split(" ").slice(-1)}</h2>
            {sent ? (
              <p className="mt-2 text-sm text-muted">Mesajul a plecat. Te sună dacă e nevoie.</p>
            ) : (
              <form
                className="mt-2 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
              >
                <div>
                  <Label htmlFor="n">Nume</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="p">Telefon</Label>
                  <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="b">Mesaj</Label>
                  <Textarea id="b" value={body} onChange={(e) => setBody(e.target.value)} required />
                </div>
                <Button type="submit" disabled={mutation.isPending}>
                  Trimite mesajul
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

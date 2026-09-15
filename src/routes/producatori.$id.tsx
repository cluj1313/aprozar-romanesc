import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ImageField } from "@/components/image-field";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { RatingBadge } from "@/components/producer-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/wa-icon";
import { SocialRow } from "@/components/social-row";
import { createMessage, saveProducer } from "@/lib/catalog-fns";
import { intlPhone, waDigits } from "@/lib/order-message";
import { DEFAULT_PRODUCER_SOCIAL_INTRO, pickSocial } from "@/lib/social";
import { useShop } from "@/lib/store";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

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
  const session = useShop((s) => s.session);
  const favoriteProducers = useShop((s) => s.favoriteProducers);
  const toggleFavoriteProducer = useShop((s) => s.toggleFavoriteProducer);
  const loved = favoriteProducers.includes(id);
  const isOwner = session.role === "producer" && session.producerId === id;
  const [editing, setEditing] = useState(false);
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
            <button
              type="button"
              aria-label={loved ? "Scoate ferma de la favorite" : "Pune ferma la favorite"}
              onClick={() => toggleFavoriteProducer(id)}
              className="flex size-11 items-center justify-center rounded-full bg-bg/90 text-primary shadow-soft"
            >
              <Heart className={cn("size-5", loved && "fill-primary")} />
            </button>
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold">{producer.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5 text-primary" />
                <span className="tabular-nums">{producer.km.toLocaleString("ro-RO")} km</span>
                <span>
                  · {producer.village}, {producer.county}
                </span>
              </p>
            </div>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-border bg-elevated px-3 text-sm font-semibold"
              >
                <Pencil className="size-3.5" />
                {editing ? "Gata" : "Edit"}
              </button>
            ) : null}
          </div>
          {story ? (
            <Link to="/povesti/$slug" params={{ slug: story.slug }} className="mt-1 inline-block text-xs font-semibold text-primary">
              {story.title} →
            </Link>
          ) : null}

          {isOwner && editing ? <ProducerPageEditor producerId={id} /> : null}

          <SocialRow social={pickSocial(producer)} fallbackIntro={DEFAULT_PRODUCER_SOCIAL_INTRO} />

          <div className="mt-5 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold">Marfa de azi</h2>
            {isOwner ? (
              <Link
                to="/admin/produs/$id"
                params={{ id: "nou" }}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-fg"
              >
                <Plus className="size-3.5" />
                Adaugă produs
              </Link>
            ) : null}
          </div>
          <ProductGrid className="product-grid-dense mt-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
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

function ProducerPageEditor({ producerId }: { producerId: string }) {
  const { data } = useCatalog();
  const producer = data?.producers.find((p) => p.id === producerId);
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [cover, setCover] = useState(producer?.image ?? "");
  const [avatar, setAvatar] = useState(producer?.avatar || producer?.image || "");
  const [blurb, setBlurb] = useState(producer?.blurb ?? "");
  const save = useMutation({
    mutationFn: () => {
      if (!producer) throw new Error("missing");
      const { blocked: _b, warningCount: _w, ...rest } = producer;
      return saveProducer({
        data: { ...rest, image: cover, avatar, blurb },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
      setFlash("Pagina fermei e salvată");
    },
  });
  if (!producer) return null;
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-dashed border-primary/40 bg-elevated p-3">
      <p className="text-sm font-semibold">Editezi pagina fermei</p>
      <ImageField label="Copertă" value={cover} onChange={setCover} />
      <ImageField label="Avatar" value={avatar} onChange={setAvatar} />
      <div>
        <Label htmlFor="blurb">Câteva vorbe</Label>
        <Textarea id="blurb" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      </div>
      <Button type="button" className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Se salvează…" : "Salvează pagina"}
      </Button>
      <Link to="/admin/produs/$id" params={{ id: "nou" }} className="block text-center text-sm font-semibold text-primary">
        Adaugă un produs cu poză și preț →
      </Link>
    </div>
  );
}

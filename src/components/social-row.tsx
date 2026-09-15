import { Facebook, Globe, Instagram, Youtube } from "lucide-react";
import { useId, type ComponentType } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SOCIAL_NETWORKS,
  socialHref,
  type SocialKey,
  type SocialValues,
} from "@/lib/social";
import { cn } from "@/lib/utils";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M19.59 6.69A4.83 4.83 0 0 1 15.82 2h-3.45v13.67a2.89 2.89 0 1 1-2.88-2.89c.28 0 .54.04.79.1v-3.5a6.34 6.34 0 1 0 5.55 6.29V8.73a8.16 8.16 0 0 0 4.76 1.52V6.8c-.35-.03-.68-.07-1-.11z"
      />
    </svg>
  );
}

const ICONS: Record<SocialKey, ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TikTokIcon,
  website: Globe,
};

function networkMeta(id: SocialKey) {
  return SOCIAL_NETWORKS.find((n) => n.id === id)!;
}

function SocialGlyph({
  network,
  active,
  className,
}: {
  network: SocialKey;
  active: boolean;
  className?: string;
}) {
  const Icon = ICONS[network];
  const meta = networkMeta(network);
  return (
    <Icon className={cn("size-5", active ? meta.colorClass : "text-subtle", className)} />
  );
}

export function SocialRow({
  social,
  fallbackIntro,
}: {
  social: SocialValues;
  fallbackIntro: string;
}) {
  const intro = social.intro.trim() || fallbackIntro;
  return (
    <section className="mt-4">
      <p className="text-sm font-light leading-relaxed text-muted">{intro}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {SOCIAL_NETWORKS.map((n) => {
          const href = socialHref(n.id, social[n.id]);
          return (
            <li key={n.id}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={n.label}
                  className="flex size-11 items-center justify-center rounded-full bg-elevated shadow-soft"
                >
                  <SocialGlyph network={n.id} active />
                </a>
              ) : (
                <span
                  aria-label={`${n.label} — nefolosit`}
                  className="flex size-11 items-center justify-center rounded-full bg-sunken"
                >
                  <SocialGlyph network={n.id} active={false} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SocialEditor({
  values,
  onChange,
  introPlaceholder,
  fieldClass,
  areaClass,
}: {
  values: SocialValues;
  onChange: (next: SocialValues) => void;
  introPlaceholder?: string;
  fieldClass?: string;
  areaClass?: string;
}) {
  const introId = useId();
  return (
    <div className="mt-4">
      <h2 className="font-semibold">Rețele și link-uri</h2>
      <p className="mt-1 text-sm text-muted">
        Un rând scurt, apoi Facebook, Instagram, YouTube, TikTok sau alt site. Icoanele cu
        link sunt colorate; cele goale rămân gri pe pagină.
      </p>
      <Label htmlFor={introId} className="mt-3">
        Textul de pe pagină
      </Label>
      {areaClass ? (
        <textarea
          id={introId}
          className={areaClass}
          placeholder={introPlaceholder}
          value={values.intro}
          onChange={(e) => onChange({ ...values, intro: e.target.value })}
          maxLength={280}
        />
      ) : (
        <Textarea
          id={introId}
          placeholder={introPlaceholder}
          value={values.intro}
          onChange={(e) => onChange({ ...values, intro: e.target.value })}
          maxLength={280}
        />
      )}
      <div className="mt-3 space-y-2">
        {SOCIAL_NETWORKS.map((n) => {
          const href = socialHref(n.id, values[n.id]);
          return (
            <div key={n.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  href ? "bg-elevated" : "bg-sunken",
                )}
                aria-hidden
              >
                <SocialGlyph network={n.id} active={Boolean(href)} />
              </span>
              {fieldClass ? (
                <input
                  className={fieldClass}
                  value={values[n.id]}
                  placeholder={n.placeholder}
                  onChange={(e) => onChange({ ...values, [n.id]: e.target.value })}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-label={n.label}
                />
              ) : (
                <Input
                  value={values[n.id]}
                  placeholder={n.placeholder}
                  onChange={(e) => onChange({ ...values, [n.id]: e.target.value })}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-label={n.label}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { AppCover } from "@/components/app-cover";
import { AppShell } from "@/components/app-shell";
import { OtherApps } from "@/components/other-apps";
import { SocialRow } from "@/components/social-row";
import { getAppPage } from "@/lib/platform-fns";
import { DEFAULT_APP_SOCIAL_INTRO, pickSocial } from "@/lib/social";
import { useShop } from "@/lib/store";
import { useAppPage } from "@/lib/use-app-page";

export const Route = createFileRoute("/aplicatia")({
  loader: () => getAppPage({ data: {} }),
  component: AplicatiaPage,
});

function AplicatiaPage() {
  const initial = Route.useLoaderData();
  const { data } = useAppPage(initial);
  const page = data ?? initial;
  const session = useShop((s) => s.session);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pb-10">
        <AppCover profile={page.profile} stats={page.stats} />
        <div className="px-4 pt-3">
          <h1 className="font-display text-2xl font-bold">{page.profile.name}</h1>
          {page.profile.tagline ? (
            <p className="mt-0.5 text-sm font-light text-muted">{page.profile.tagline}</p>
          ) : null}
          {session.role === "admin" ? (
            <Link
              to="/admin"
              search={{ tab: "aplicatia" }}
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              Editează pagina
            </Link>
          ) : null}

          <SocialRow social={pickSocial(page.profile)} fallbackIntro={DEFAULT_APP_SOCIAL_INTRO} />

          <div className="mt-6 space-y-5">
            {page.blocks.map((b) => (
              <section key={b.id}>
                <h2 className="font-display text-xl font-bold text-balance">{b.title}</h2>
                <p className="mt-1.5 text-sm font-light leading-relaxed text-pretty text-muted">
                  {b.body}
                </p>
              </section>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="font-display text-lg font-bold tracking-wide uppercase">
              Alte aplicații de-ale mele
            </h2>
            <div className="mt-3">
              <OtherApps
                apps={page.apps}
                empty={
                  session.role === "admin" ? (
                    <p className="text-sm font-light text-muted">
                      Nicio altă aplicație încă. Adaug-o din Admin → Aplicația, cu poză și link.
                    </p>
                  ) : (
                    <p className="text-sm font-light text-muted">
                      Gabriel își pune aici celelalte aplicații.
                    </p>
                  )
                }
              />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

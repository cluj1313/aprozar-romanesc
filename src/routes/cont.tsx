import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { AppShell } from "@/components/app-shell";
import { InstallApp } from "@/components/install-app";
import { MyAds } from "@/components/my-ads";
import { MyNotices } from "@/components/my-notices";
import { OtherApps } from "@/components/other-apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCER_PIN } from "@/lib/categories";
import { renameProducer } from "@/lib/catalog-fns";
import { adStatusOf } from "@/lib/ad-live";
import { formatLei } from "@/lib/money";
import { stageOf } from "@/lib/order-status";
import { useShop } from "@/lib/store";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { useAppPage } from "@/lib/use-app-page";
import { formatWhen } from "@/lib/utils";

export const Route = createFileRoute("/cont")({ component: ContPage });

function ContPage() {
  const session = useShop((s) => s.session);
  const setSession = useShop((s) => s.setSession);
  const myOrders = useShop((s) => s.myOrders);
  const { data } = useCatalog();
  const { data: appPage } = useAppPage();
  const farms = data?.producers ?? [];
  const startId =
    session.role === "producer" ? session.producerId : (farms[0]?.id ?? "nelu");
  const [pin, setPin] = useState("");
  const [producerId, setProducerId] = useState(startId);
  const selected = farms.find((p) => p.id === producerId) ?? farms[0];
  const [farmName, setFarmName] = useState(selected?.name ?? "");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);

  const pickFarm = (id: string) => {
    setProducerId(id);
    const farm = farms.find((p) => p.id === id);
    if (farm) setFarmName(farm.name);
    setErr("");
  };

  const rename = useMutation({
    mutationFn: (p: { id: string; name: string }) => renameProducer({ data: p }),
    onSuccess: () => {
      setFlash("Numele grădinii e salvat");
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  const ownFarm = session.role === "producer" && session.producerId === producerId;
  const nameDirty = farmName.trim() !== (selected?.name ?? "") && farmName.trim().length >= 2;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">Cont</h1>
        <p className="mt-1 text-sm text-muted">
          Cumpărătorul nu are nevoie de cont. Producătorul își ține taraba. Administratorul ține
          aplicația — fără să intre în conturile voastre.
        </p>

        <div className="mt-5">
          <InstallApp />
        </div>

        <div className="mt-5">
          <MyNotices />
        </div>

        {session.role === "guest" ? (
          <div className="mt-6 rounded-xl border border-border bg-elevated p-4">
            <p className="font-semibold">Administratorul aplicației</p>
            <p className="mt-1 text-xs text-muted">
              Cioban Iosif Gabriel — categorii, anunțuri, reclame, sponsori. Nu umblă în taraba ta.
            </p>
            <Button asChild className="mt-3 w-full">
              <Link to="/admin">Intră în Admin</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-elevated p-4">
            <p className="font-semibold">
              {session.role === "admin"
                ? `Admin: ${session.name}`
                : `Taraba: ${data?.producers.find((p) => session.role === "producer" && p.id === session.producerId)?.name}`}
            </p>
            <Button asChild className="mt-3 w-full">
              <Link to="/admin">{session.role === "admin" ? "Deschide Adminul" : "Deschide taraba"}</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 w-full"
              onClick={() => setSession({ role: "guest" })}
            >
              Ieși
            </Button>
          </div>
        )}

        {session.role === "producer" ? (
          <MyAds
            ads={(data?.ads ?? []).filter((a) => a.producerId === session.producerId)}
            allAds={data?.ads ?? []}
          />
        ) : null}
        {session.role === "admin" &&
        (data?.ads ?? []).some((a) => adStatusOf(a) === "review") ? (
          <section className="mt-6 rounded-xl border border-border bg-elevated p-4">
            <p className="font-semibold">Reclame de aprobat</p>
            <p className="mt-1 text-sm text-muted">
              {(data?.ads ?? []).filter((a) => adStatusOf(a) === "review").length} trimise către
              aprobare. Verifică să nu fie ceva ilegal, interzis sau nepotrivit.
            </p>
            <Button asChild className="mt-3 w-full" variant="secondary">
              <Link to="/admin" search={{ tab: "reclame" }}>
                Deschide reclamele
              </Link>
            </Button>
          </section>
        ) : null}

        <form
          className="mt-4 rounded-xl border border-border bg-elevated p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin.trim() !== PRODUCER_PIN) {
              setErr("Parola nu e bună. Pentru tarabă e: taraba");
              return;
            }
            const nextName = farmName.trim();
            const go = () => {
              setSession({ role: "producer", producerId });
              void navigate({ to: "/admin" });
            };
            if (nextName.length >= 2 && nextName !== (selected?.name ?? "")) {
              rename.mutate(
                { id: producerId, name: nextName },
                {
                  onSuccess: go,
                  onError: go,
                },
              );
              return;
            }
            go();
          }}
        >
          <p className="font-semibold">Sunt producător</p>
          <p className="mt-1 text-xs text-muted">
            Alege grădina, schimbă-i numele dacă vrei, apoi intră cu parola. Doar tu îți schimbi
            produsele.
          </p>

          <p className="mt-3 text-sm font-semibold">Ferma mea</p>
          <select
            className="mt-1 h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm font-semibold"
            value={producerId}
            onChange={(e) => pickFarm(e.target.value)}
          >
            {farms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="mt-3">
            <Label htmlFor="farm-name">Numele grădinii</Label>
            <Input
              id="farm-name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Ex. Grădina lui Nelu"
            />
          </div>
          {nameDirty ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-2 w-full"
              disabled={rename.isPending}
              onClick={() => {
                if (!ownFarm && pin.trim() !== PRODUCER_PIN) {
                  setErr("Pune parola tarabei ca să schimbi numele");
                  return;
                }
                setErr("");
                rename.mutate({ id: producerId, name: farmName.trim() });
              }}
            >
              Salvează numele
            </Button>
          ) : null}

          <div className="mt-3">
            <Label htmlFor="pin2">Parolă tarabă</Label>
            <Input
              id="pin2"
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
          {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
          <Button type="submit" className="mt-3 w-full" variant="secondary">
            Intră la taraba mea
          </Button>
        </form>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Comenzile mele</h2>
          {myOrders.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nicio comandă din telefonul ăsta.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {myOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/cos"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-elevated px-4 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium tabular-nums">{formatWhen(o.createdAt)}</span>
                      <span className="block truncate text-xs text-muted">{stageOf(o).title}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-primary">
                      {formatLei(o.totalBani)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Pagina aplicației</h2>
          <Link
            to="/aplicatia"
            className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-elevated p-3"
          >
            <img
              src={appPage?.profile.cover || "/images/splash.png"}
              alt=""
              className="size-16 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold">
                {appPage?.profile.name ?? "Aprozar Românesc"}
              </span>
              <span className="mt-0.5 block text-sm font-normal text-muted">
                Prezentarea aplicației, nu a produselor.
              </span>
            </span>
          </Link>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg font-bold tracking-wide uppercase">
            Alte aplicații de-ale mele
          </h2>
          <div className="mt-3">
            <OtherApps
              apps={appPage?.apps ?? []}
              empty={
                <p className="text-sm text-muted">
                  {session.role === "admin"
                    ? "Adaugă aplicațiile din Admin → Aplicația, cu poză și link."
                    : "Gabriel își pune aici celelalte aplicații."}
                </p>
              }
            />
          </div>
        </section>

        <div className="mt-6">
          <AdSlot position="account_bottom" className="px-0 pb-0" />
        </div>
      </div>
    </AppShell>
  );
}

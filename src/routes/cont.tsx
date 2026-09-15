import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { AppShell } from "@/components/app-shell";
import { InstallApp } from "@/components/install-app";
import { MyAds } from "@/components/my-ads";
import { MyNotices } from "@/components/my-notices";
import { OtherApps } from "@/components/other-apps";
import { Pill, PillRow } from "@/components/admin/pills";
import { HintField } from "@/components/hint-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phonesMatch } from "@/lib/admin-identity";
import { verifyAdminLogin } from "@/lib/admin-login-fn";
import { PRODUCER_PIN } from "@/lib/categories";
import { renameProducer } from "@/lib/catalog-fns";
import { adStatusOf } from "@/lib/ad-live";
import { formatLei } from "@/lib/money";
import { farmLabel, stageOf } from "@/lib/order-status";
import { useShop } from "@/lib/store";
import { catalogQueryKey, useCatalog } from "@/lib/use-catalog";
import { useAppPage } from "@/lib/use-app-page";
import { usePlatform } from "@/lib/use-platform";
import { formatWhen } from "@/lib/utils";

const CONT_TABS = [
  { id: "client", label: "Client" },
  { id: "producator", label: "Producător" },
  { id: "sponsori", label: "Sponsori" },
  { id: "admin", label: "Admin" },
] as const;

type ContTab = (typeof CONT_TABS)[number]["id"];

function parseTab(v: unknown): ContTab {
  return CONT_TABS.some((t) => t.id === v) ? (v as ContTab) : "client";
}

export const Route = createFileRoute("/cont")({
  validateSearch: (raw: Record<string, unknown>): { tab?: ContTab } => {
    const tab = parseTab(raw.tab);
    return tab === "client" ? {} : { tab };
  },
  component: ContPage,
});

function LoginCard({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-elevated p-4">
      <h2 className="font-semibold">Logare în aplicație</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      {children}
    </section>
  );
}

function ContPage() {
  const session = useShop((s) => s.session);
  const tab = Route.useSearch().tab ?? (session.role === "producer" ? "producator" : session.role === "admin" ? "admin" : "client");
  const navigate = Route.useNavigate();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 pb-10">
        <h1 className="pt-3 font-display text-2xl font-semibold">Cont</h1>
        <p className="mt-2 text-sm text-muted">
          Client, producător, sponsori și admin — fiecare cu logarea lui.
        </p>
        <div className="mt-4">
          <MyNotices />
        </div>
        <div className="mt-4">
          <PillRow>
            {CONT_TABS.map((t) => (
              <Pill
                key={t.id}
                active={tab === t.id}
                onClick={() => void navigate({ search: t.id === "client" ? {} : { tab: t.id } })}
              >
                {t.label}
              </Pill>
            ))}
          </PillRow>
        </div>
        <div className="mt-4">
          {tab === "client" ? <ClientPane /> : null}
          {tab === "producator" ? <ProducerPane /> : null}
          {tab === "sponsori" ? <SponsorPane /> : null}
          {tab === "admin" ? <AdminPane /> : null}
        </div>
      </div>
    </AppShell>
  );
}

function ClientPane() {
  const contact = useShop((s) => s.contact);
  const rememberContact = useShop((s) => s.rememberContact);
  const myOrders = useShop((s) => s.myOrders);
  const savedLogins = useShop((s) => s.savedLogins);
  const { data: appPage } = useAppPage();
  const session = useShop((s) => s.session);
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [err, setErr] = useState("");
  const setFlash = useShop((s) => s.setFlash);

  const pick = (row: { name: string; phone: string }) => {
    setName(row.name);
    setPhone(row.phone);
    setErr("");
  };

  return (
    <div className="space-y-4">
      <LoginCard hint="Numele și telefonul rămân pe telefonul ăsta. Nu e nevoie de parolă.">
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length < 2 || phone.trim().length < 6) {
              setErr("Scrie numele și telefonul.");
              return;
            }
            rememberContact({ name: name.trim(), phone: phone.trim() });
            setFlash("Ești logat ca client.");
            setErr("");
          }}
        >
          <HintField
            id="cli-name"
            name="apro-cli-nm"
            label="Nume"
            field="name"
            value={name}
            saved={savedLogins}
            placeholder="Numele tău"
            onChange={(v) => {
              setName(v);
              setErr("");
            }}
            onPick={pick}
          />
          <div className="mt-3">
            <HintField
              id="cli-phone"
              name="apro-cli-ph"
              label="Telefon"
              field="phone"
              value={phone}
              saved={savedLogins}
              placeholder="07…"
              inputMode="tel"
              onChange={(v) => {
                setPhone(v);
                setErr("");
              }}
              onPick={pick}
            />
          </div>
          {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
          <Button type="submit" className="mt-3 w-full">
            Intră ca client
          </Button>
          {contact ? (
            <p className="mt-2 text-xs text-muted">Logat: {contact.name} · {contact.phone}</p>
          ) : null}
        </form>
      </LoginCard>

      <section>
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
                    <span className="flex items-center gap-1.5">
                      <span className="flex shrink-0 -space-x-1.5">
                        {o.items
                          .map((i) => i.image)
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((src, i) => (
                            <img
                              key={`${o.id}-${i}`}
                              src={src}
                              alt=""
                              className="size-8 rounded-md object-cover outline outline-1 outline-bg"
                            />
                          ))}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium tabular-nums">{formatWhen(o.createdAt)}</span>
                        <span className="block truncate text-xs text-muted">
                          {farmLabel(o)} · {stageOf(o).title}
                        </span>
                      </span>
                    </span>
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

      <InstallApp />

      <section>
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

      <section>
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">
          Alte aplicații de-ale mele
        </h2>
        <div className="mt-3">
          <OtherApps
            apps={appPage?.apps ?? []}
            empty={
              <p className="text-sm text-muted">
                {session.role === "admin"
                  ? "Adaugă aplicațiile de pe pagina aplicației, cu banner și link."
                  : "Gabriel își pune aici celelalte aplicații."}
              </p>
            }
          />
        </div>
      </section>

      <AdSlot position="account_bottom" className="px-0 pb-0" />
    </div>
  );
}

function ProducerPane() {
  const session = useShop((s) => s.session);
  const setSession = useShop((s) => s.setSession);
  const { data } = useCatalog();
  const farms = data?.producers ?? [];
  const startId = session.role === "producer" ? session.producerId : (farms[0]?.id ?? "nelu");
  const [pin, setPin] = useState("");
  const [producerId, setProducerId] = useState(startId);
  const selected = farms.find((p) => p.id === producerId) ?? farms[0];
  const [farmName, setFarmName] = useState(selected?.name ?? "");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const ownFarm = session.role === "producer" && session.producerId === producerId;
  const nameDirty = farmName.trim() !== (selected?.name ?? "") && farmName.trim().length >= 2;

  const rename = useMutation({
    mutationFn: (p: { id: string; name: string }) => renameProducer({ data: p }),
    onSuccess: () => {
      setFlash("Numele grădinii e salvat");
      void qc.invalidateQueries({ queryKey: catalogQueryKey });
    },
  });

  if (session.role === "producer") {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-elevated p-4">
          <p className="font-semibold">
            Producător · {data?.producers.find((p) => p.id === session.producerId)?.name}
          </p>
          <Button asChild className="mt-3 w-full">
            <Link to="/admin">Deschide taraba</Link>
          </Button>
          <Button asChild variant="secondary" className="mt-2 w-full">
            <Link to="/producatori/$id" params={{ id: session.producerId }}>
              Editează pagina fermei
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => setSession({ role: "guest" })}
          >
            Ieși din tarabă
          </Button>
        </section>
        <MyAds
          ads={(data?.ads ?? []).filter((a) => a.producerId === session.producerId)}
          allAds={data?.ads ?? []}
        />
      </div>
    );
  }

  return (
    <LoginCard hint="Alege grădina și intră cu parola tarabei. Doar tu îți schimbi produsele.">
      <form
        className="mt-3"
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
              { onSuccess: go, onError: go },
            );
            return;
          }
          go();
        }}
      >
        <Label htmlFor="farm">Ferma mea</Label>
        <select
          id="farm"
          className="mt-1 h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm font-semibold"
          value={producerId}
          onChange={(e) => {
            const id = e.target.value;
            setProducerId(id);
            const farm = farms.find((p) => p.id === id);
            if (farm) setFarmName(farm.name);
            setErr("");
          }}
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
        <Button type="submit" className="mt-3 w-full">
          Intră la taraba mea
        </Button>
      </form>
    </LoginCard>
  );
}

function SponsorPane() {
  const { data: platform } = usePlatform();
  const contact = useShop((s) => s.contact);
  const rememberContact = useShop((s) => s.rememberContact);
  const savedLogins = useShop((s) => s.savedLogins);
  const setFlash = useShop((s) => s.setFlash);
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [err, setErr] = useState("");
  const sponsors = platform?.sponsors ?? [];
  const matched = sponsors.find((s) => phonesMatch(s.phone, phone) || phonesMatch(s.phone, contact?.phone ?? ""));

  const pick = (row: { name: string; phone: string }) => {
    setName(row.name);
    setPhone(row.phone);
    setErr("");
  };

  return (
    <LoginCard hint="Numele și telefonul de sponsor. Mesajele sunt la Mesaje → Sponsori.">
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const found = sponsors.find((s) => phonesMatch(s.phone, phone.trim()));
          if (!found) {
            setErr("Telefonul nu e pe lista de sponsori.");
            return;
          }
          rememberContact({ name: name.trim() || found.name, phone: phone.trim() });
          setFlash(`Bine ai venit, ${found.company || found.name}.`);
          setErr("");
        }}
      >
        <HintField
          id="sp-name"
          name="apro-sp-nm"
          label="Nume"
          field="name"
          value={name}
          saved={savedLogins}
          placeholder="Numele tău"
          onChange={(v) => {
            setName(v);
            setErr("");
          }}
          onPick={pick}
        />
        <div className="mt-3">
          <HintField
            id="sp-phone"
            name="apro-sp-ph"
            label="Telefon"
            field="phone"
            value={phone}
            saved={savedLogins}
            placeholder="07…"
            inputMode="tel"
            onChange={(v) => {
              setPhone(v);
              setErr("");
            }}
            onPick={pick}
          />
        </div>
        {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
        <Button type="submit" className="mt-3 w-full">
          Intră ca sponsor
        </Button>
      </form>
      {matched ? (
        <div className="mt-3">
          <p className="text-sm text-muted">
            Logat: {matched.name}
            {matched.company ? ` · ${matched.company}` : ""}
          </p>
          <Button asChild variant="secondary" className="mt-3 w-full">
            <Link to="/mesaje" search={{ cutie: "sponsori" }}>
              Deschide mesajele de sponsor
            </Link>
          </Button>
        </div>
      ) : null}
    </LoginCard>
  );
}

function AdminPane() {
  const session = useShop((s) => s.session);
  const setSession = useShop((s) => s.setSession);
  const rememberLogin = useShop((s) => s.rememberLogin);
  const savedLogins = useShop((s) => s.savedLogins);
  const setFlash = useShop((s) => s.setFlash);
  const { data } = useCatalog();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (row: { name: string; email: string; phone: string }) => {
    setName(row.name);
    setEmail(row.email);
    setPhone(row.phone);
    setErr("");
  };

  if (session.role === "admin") {
    return (
      <section className="rounded-2xl border border-border bg-elevated p-4">
        <p className="font-semibold">Admin: {session.name}</p>
        <Button asChild className="mt-3 w-full">
          <Link to="/admin">Deschide Adminul</Link>
        </Button>
        {(data?.ads ?? []).some((a) => adStatusOf(a) === "review") ? (
          <Button asChild className="mt-2 w-full" variant="secondary">
            <Link to="/admin" search={{ tab: "reclame" }}>
              Reclame de aprobat
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => setSession({ role: "guest" })}
        >
          Ieși din admin
        </Button>
      </section>
    );
  }

  return (
    <LoginCard hint="Doar cine ține aplicația. Categorii, anunțuri, reclame, sponsori.">
      <form
        className="relative mt-3"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const login = { name: name.trim(), email: email.trim(), phone: phone.trim() };
          if (!login.email || !login.phone) {
            setErr("Scrie emailul și telefonul de administrator.");
            return;
          }
          setBusy(true);
          setErr("");
          void verifyAdminLogin({ data: login })
            .then((result) => {
              if (!result.ok) {
                setErr("Datele nu se potrivesc cu administratorul aplicației.");
                return;
              }
              rememberLogin({ ...login, name: result.name });
              setSession({ role: "admin", name: result.name, email: "", phone: "" });
              setFlash("Bine ai venit.");
              void navigate({ to: "/admin", replace: true });
            })
            .catch(() => setErr("Nu am putut verifica datele. Încearcă din nou."))
            .finally(() => setBusy(false));
        }}
      >
        <HintField
          id="adm-name"
          name="apro-adm-nm"
          label="Nume"
          field="name"
          value={name}
          saved={savedLogins}
          placeholder="Numele tău"
          onChange={(v) => {
            setName(v);
            setErr("");
          }}
          onPick={pick}
        />
        <div className="mt-3">
          <HintField
            id="adm-email"
            name="apro-adm-em"
            label="Email"
            field="email"
            value={email}
            saved={savedLogins}
            placeholder="email"
            inputMode="email"
            onChange={(v) => {
              setEmail(v);
              setErr("");
            }}
            onPick={pick}
          />
        </div>
        <div className="mt-3">
          <HintField
            id="adm-phone"
            name="apro-adm-ph"
            label="Telefon"
            field="phone"
            value={phone}
            saved={savedLogins}
            placeholder="07…"
            inputMode="tel"
            onChange={(v) => {
              setPhone(v);
              setErr("");
            }}
            onPick={pick}
          />
        </div>
        {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
        <Button type="submit" className="mt-3 w-full" disabled={busy}>
          {busy ? "Se verifică…" : "Intră ca administrator"}
        </Button>
      </form>
    </LoginCard>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HintField } from "@/components/hint-field";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { verifyAdminLogin } from "@/lib/admin-login-fn";
import { useShop } from "@/lib/store";

export function AdminLogin() {
  const setSession = useShop((s) => s.setSession);
  const rememberLogin = useShop((s) => s.rememberLogin);
  const savedLogins = useShop((s) => s.savedLogins);
  const setFlash = useShop((s) => s.setFlash);
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

  return (
    <div className="mx-auto max-w-xl px-4 pb-10">
      <form
        autoComplete="off"
        autoCorrect="off"
        className="relative mt-4 rounded-2xl border border-border bg-elevated p-5 shadow-soft"
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
              setSession({
                role: "admin",
                name: result.name,
                email: "",
                phone: "",
              });
              setFlash("Bine ai venit.");
              void navigate({ to: "/admin", replace: true });
            })
            .catch(() => {
              setErr("Nu am putut verifica datele. Încearcă din nou.");
            })
            .finally(() => {
              setBusy(false);
            });
        }}
      >
        <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
          <input type="text" name="email" autoComplete="email" tabIndex={-1} />
          <input type="tel" name="phone" autoComplete="tel" tabIndex={-1} />
          <input type="text" name="username" autoComplete="username" tabIndex={-1} />
        </div>
        <LogoMark className="size-12" />
        <h1 className="mt-3 font-display text-2xl font-semibold">Adminul aplicației</h1>
        <p className="mt-1 text-sm text-muted">
          Gestionezi categorii, anunțuri, reclame și sponsori. Nu intri în conturile oamenilor —
          taraba e a lor.
        </p>

        <div className="mt-5">
          <HintField
            id="admin-name"
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
        </div>
        <div className="mt-3">
          <HintField
            id="admin-email"
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
            id="admin-phone"
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
        <Button type="submit" className="mt-4 w-full rounded-xl" disabled={busy}>
          {busy ? "Se verifică…" : "Intră în Admin"}
        </Button>
        <p className="mt-3 text-xs text-subtle">
          Câmpurile pornesc goale. După ce te-ai logat o dată, la prima literă apar datele tale, pe
          telefonul ăsta.
        </p>
      </form>
    </div>
  );
}

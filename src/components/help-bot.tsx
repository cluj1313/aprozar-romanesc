import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { askHelpBot } from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import { platformQueryKey } from "@/lib/use-platform";

export function HelpBot() {
  const session = useShop((s) => s.session);
  const contact = useShop((s) => s.contact);
  const rememberContact = useShop((s) => s.rememberContact);
  const qc = useQueryClient();
  const [name, setName] = useState(session.role === "admin" ? session.name : (contact?.name ?? ""));
  const [phone, setPhone] = useState(session.role === "admin" ? session.phone : (contact?.phone ?? ""));
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<{ text: string; source: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      askHelpBot({
        data: { question, authorName: name, authorPhone: phone },
      }),
    onSuccess: (res) => {
      setReply({ text: res.text, source: res.source });
      setQuestion("");
      if (name.trim() && phone.trim()) rememberContact({ name: name.trim(), phone: phone.trim() });
      void qc.invalidateQueries({ queryKey: platformQueryKey });
      void qc.invalidateQueries({ queryKey: ["notices"] });
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-elevated p-4">
      <h2 className="font-semibold">Întreabă Aprozarul</h2>
      <p className="mt-1 text-sm text-muted">
        Botul răspunde din ce l-a învățat administratorul. Dacă nu știe, întrebarea merge la Cioban
        Iosif Gabriel — el nu intră în contul tău.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="help-name">Nume</Label>
          <Input id="help-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="help-phone">Telefon</Label>
          <Input
            id="help-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
      </div>
      <div className="mt-2">
        <Label htmlFor="help-q">Întrebarea ta</Label>
        <Textarea
          id="help-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex. Cum îmi pun taraba?"
        />
      </div>
      <Button
        className="mt-3 w-full"
        type="button"
        disabled={mutation.isPending || question.trim().length < 3}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Se uită în antrenament…" : "Trimite întrebarea"}
      </Button>
      {reply ? (
        <div className="mt-3 rounded-xl bg-panel px-3 py-3 text-sm text-panel-fg">
          <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
            {reply.source === "training"
              ? "Din antrenament"
              : reply.source === "bot"
                ? "Botul Aprozarului"
                : "Către administrator"}
          </p>
          <p className="mt-1">{reply.text}</p>
        </div>
      ) : null}
    </section>
  );
}

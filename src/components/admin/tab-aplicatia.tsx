import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppCover } from "@/components/app-cover";
import { AppsEditor } from "@/components/apps-editor";
import { ImageField } from "@/components/image-field";
import { MsgActions } from "@/components/msg-actions";
import { SocialEditor } from "@/components/social-row";
import { adminArea, adminField } from "@/components/admin/pills";
import { Button } from "@/components/ui/button";
import {
  deleteAppBlock,
  saveAppBlock,
  saveAppProfile,
} from "@/lib/platform-fns";
import { DEFAULT_APP_SOCIAL_INTRO, pickSocial, withSocial } from "@/lib/social";
import { useShop } from "@/lib/store";
import type { AppBlock, Platform } from "@/lib/types";
import { appPageQueryKey } from "@/lib/use-app-page";
import { catalogQueryKey } from "@/lib/use-catalog";
import { platformQueryKey } from "@/lib/use-platform";

export function TabAplicatia({ platform }: { platform: Platform }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [name, setName] = useState(platform.appProfile.name);
  const [tagline, setTagline] = useState(platform.appProfile.tagline);
  const [cover, setCover] = useState(platform.appProfile.cover);
  const [avatar, setAvatar] = useState(platform.appProfile.avatar);
  const [phone, setPhone] = useState(platform.appProfile.phone);
  const [social, setSocial] = useState(pickSocial(platform.appProfile));

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: platformQueryKey });
    void qc.invalidateQueries({ queryKey: appPageQueryKey });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
  };

  const saveProfile = useMutation({
    mutationFn: () =>
      saveAppProfile({
        data: withSocial({ name, tagline, cover, avatar, phone }, social),
      }),
    onSuccess: () => {
      setFlash("Pagina aplicației e salvată");
      refresh();
    },
  });

  return (
    <div>
      <p className="text-sm text-muted">
        Pagina de prezentare a aplicației — nu a produselor. Copertă, avatar, WhatsApp, telefon,
        textul tău și celelalte aplicații, fiecare cu banner și link. Numerele din dreapta jos se
        actualizează la fiecare reîncărcare.
      </p>

      <div className="-mx-4 mt-4 overflow-hidden border-y border-border">
        <AppCover
          profile={withSocial({ id: "main", name, tagline, cover, avatar, phone }, social)}
          stats={platform.live}
        />
      </div>

      <h2 className="mt-5 font-semibold">Coperta</h2>
      <ImageField label="Poza de copertă" value={cover} onChange={setCover} />
      <div className="mt-3">
        <ImageField label="Avatar" value={avatar} onChange={setAvatar} />
      </div>
      <input
        className={`${adminField} mt-3`}
        placeholder="Numele aplicației"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={`${adminField} mt-2`}
        placeholder="Un rând sub nume"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      />
      <input
        className={`${adminField} mt-2`}
        placeholder="Telefon / WhatsApp"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
      />
      <SocialEditor
        values={social}
        onChange={setSocial}
        introPlaceholder={DEFAULT_APP_SOCIAL_INTRO}
        fieldClass={adminField}
        areaClass={`${adminArea} min-h-20`}
      />
      <Button
        type="button"
        className="mt-3 w-full rounded-xl"
        disabled={saveProfile.isPending || name.trim().length < 2}
        onClick={() => saveProfile.mutate()}
      >
        Salvează coperta
      </Button>

      <BlocksEditor blocks={platform.appBlocks} onDone={refresh} />
      <AppsEditor apps={platform.appApps} onDone={refresh} />
    </div>
  );
}

function BlocksEditor({
  blocks,
  onDone,
}: {
  blocks: AppBlock[];
  onDone: () => void;
}) {
  const setFlash = useShop((s) => s.setFlash);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveAppBlock({
        data: { id: editId ?? undefined, title, body },
      }),
    onSuccess: () => {
      setEditId(null);
      setTitle("");
      setBody("");
      setFlash("Textul e pus");
      onDone();
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAppBlock({ data: { id } }),
    onSuccess: onDone,
  });

  return (
    <section className="mt-8">
      <h2 className="font-semibold">Textul de pe pagină</h2>
      <p className="mt-1 text-sm text-muted">Titlul e gros. Corpul e subțire.</p>
      <input
        className={`${adminField} mt-3`}
        placeholder="Titlu gros"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${adminArea} mt-2`}
        placeholder="Textul corpului, cu litere subțiri"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        type="button"
        className="mt-2 w-full rounded-xl"
        disabled={save.isPending || title.trim().length < 2 || body.trim().length < 2}
        onClick={() => save.mutate()}
      >
        {editId ? "Salvează textul" : "Adaugă textul"}
      </Button>
      {editId ? (
        <button
          type="button"
          className="mt-2 w-full text-sm font-semibold text-muted"
          onClick={() => {
            setEditId(null);
            setTitle("");
            setBody("");
          }}
        >
          Renunță
        </button>
      ) : null}
      <ul className="mt-4 space-y-2">
        {blocks.map((b) => (
          <li key={b.id} className="rounded-2xl border border-border bg-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold">{b.title}</p>
                <p className="mt-1 text-sm font-light text-muted">{b.body}</p>
              </div>
              <MsgActions
                onEdit={() => {
                  setEditId(b.id);
                  setTitle(b.title);
                  setBody(b.body);
                }}
                onDelete={() => del.mutate(b.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

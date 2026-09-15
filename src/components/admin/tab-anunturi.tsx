import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImageField } from "@/components/image-field";
import { Pill, PillRow, adminArea, adminField } from "@/components/admin/pills";
import { MsgActions } from "@/components/msg-actions";
import { NoticeMedia } from "@/components/notice-media";
import { Button } from "@/components/ui/button";
import {
  deleteAnnouncement,
  sendAnnouncement,
  setAnnouncementHidden,
  updateAnnouncement,
} from "@/lib/platform-fns";
import { useShop } from "@/lib/store";
import type { Announcement, AnnouncementAudience, Platform } from "@/lib/types";
import { platformQueryKey } from "@/lib/use-platform";
import { catalogQueryKey } from "@/lib/use-catalog";
import { appPageQueryKey } from "@/lib/use-app-page";
import { cn, formatWhen } from "@/lib/utils";

export function TabAnunturi({ platform }: { platform: Platform }) {
  const qc = useQueryClient();
  const setFlash = useShop((s) => s.setFlash);
  const [editId, setEditId] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [userId, setUserId] = useState(platform.people[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: platformQueryKey });
    void qc.invalidateQueries({ queryKey: catalogQueryKey });
    void qc.invalidateQueries({ queryKey: appPageQueryKey });
    void qc.invalidateQueries({ queryKey: ["notices"] });
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setBody("");
    setImage("");
    setLinkUrl("");
    setAudience("all");
  };

  const startEdit = (a: Announcement) => {
    setEditId(a.id);
    setAudience(a.audience);
    setUserId(a.userId ?? platform.people[0]?.id ?? "");
    setTitle(a.title);
    setBody(a.body);
    setImage(a.image);
    setLinkUrl(a.linkUrl);
    document.getElementById("anunt-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const payload = {
    audience,
    userId: audience === "user" ? userId : null,
    title,
    body,
    image,
    linkUrl,
  };

  const send = useMutation({
    mutationFn: () =>
      editId
        ? updateAnnouncement({ data: { id: editId, ...payload } })
        : sendAnnouncement({ data: payload }),
    onSuccess: () => {
      resetForm();
      setFlash(editId ? "Anunțul e salvat" : "Anunțul a plecat");
      refresh();
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAnnouncement({ data: { id } }),
    onSuccess: (_, id) => {
      if (editId === id) resetForm();
      refresh();
    },
  });
  const hide = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => setAnnouncementHidden({ data: p }),
    onSuccess: refresh,
  });

  return (
    <div>
      <p className="text-sm font-semibold text-muted">Către</p>
      <p className="mt-1 text-sm text-muted">
        La toți, la cumpărători, la producători — sau privat, doar la un om. Poți pune poză și link,
        de exemplu către o altă aplicație de-a ta. Anunțul către toți iese pe Acasă.
      </p>
      <div className="mt-2">
        <PillRow>
          <Pill active={audience === "all"} onClick={() => setAudience("all")}>
            Toți
          </Pill>
          <Pill active={audience === "buyers"} onClick={() => setAudience("buyers")}>
            Cumpărători
          </Pill>
          <Pill active={audience === "producers"} onClick={() => setAudience("producers")}>
            Producători
          </Pill>
          <Pill active={audience === "user"} onClick={() => setAudience("user")}>
            Un om
          </Pill>
        </PillRow>
      </div>
      {audience === "user" ? (
        <select className={`${adminField} mt-3`} value={userId} onChange={(e) => setUserId(e.target.value)}>
          {platform.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {roleLabel(p.role)}
            </option>
          ))}
        </select>
      ) : null}

      {platform.appApps.length ? (
        <select
          className={`${adminField} mt-3`}
          value=""
          onChange={(e) => {
            const app = platform.appApps.find((a) => a.id === e.target.value);
            if (!app) return;
            setTitle(app.title);
            setBody(app.body);
            setImage(app.image);
            setLinkUrl(app.url);
          }}
        >
          <option value="">Pune o aplicație de-a mea în anunț…</option>
          {platform.appApps.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      ) : null}

      <div id="anunt-form">
        <input
          className={`${adminField} mt-3`}
          placeholder="Titlu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={`${adminArea} mt-2`}
          placeholder="Textul anunțului"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2">
          <ImageField label="Poză (opțional)" value={image} onChange={setImage} />
        </div>
        <input
          className={`${adminField} mt-2`}
          placeholder="Link  — https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
      </div>
      <Button
        type="button"
        className="mt-3 w-full rounded-xl"
        disabled={send.isPending || title.trim().length < 2 || body.trim().length < 2}
        onClick={() => send.mutate()}
      >
        {editId ? "Salvează anunțul" : "Trimite anunțul"}
      </Button>
      {editId ? (
        <button
          type="button"
          className="mt-2 w-full text-sm font-semibold text-muted"
          onClick={resetForm}
        >
          Renunță la editare
        </button>
      ) : null}

      <ul className="mt-6 space-y-2">
        {platform.announcements.map((a) => (
          <li
            key={a.id}
            className={cn(
              "rounded-2xl border border-border bg-elevated p-4",
              a.hidden && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-subtle">
                  {audienceLabel(a.audience)} · {formatWhen(a.createdAt)}
                  {a.hidden ? " · Ascuns" : ""}
                </p>
                <p className="mt-1 text-sm">{a.body}</p>
                <NoticeMedia notice={a} />
              </div>
              <MsgActions
                hidden={a.hidden}
                onEdit={() => startEdit(a)}
                onHide={() => hide.mutate({ id: a.id, hidden: !a.hidden })}
                onDelete={() => del.mutate(a.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "buyer") return "cumpărător";
  if (role === "producer") return "producător";
  return "sponsor";
}

function audienceLabel(a: AnnouncementAudience) {
  if (a === "all") return "Toți";
  if (a === "buyers") return "Cumpărători";
  if (a === "producers") return "Producători";
  return "Privat";
}

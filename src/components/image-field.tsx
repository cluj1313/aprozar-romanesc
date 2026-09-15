import { Camera, Images } from "lucide-react";
import { adminField } from "@/components/admin/pills";
import { cn } from "@/lib/utils";

export function ImageField({
  value,
  onChange,
  onError,
  label,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  onError?: (msg: string) => void;
  label?: string;
  wide?: boolean;
}) {
  return (
    <div>
      {label ? <p className="text-sm font-semibold">{label}</p> : null}
      {value ? (
        <img
          src={value}
          alt=""
          className={cn(
            "mt-1 w-full rounded-xl bg-sunken object-cover object-center",
            wide ? "max-h-36 aspect-video" : "h-28",
          )}
        />
      ) : null}
      <input
        className={`${adminField} mt-1`}
        placeholder={wide ? "Linkul bannerului (opțional)" : "Linkul pozei (opțional)"}
        value={value.startsWith("data:") ? "Poză aleasă de pe telefon" : value}
        onChange={(e) => onChange(e.target.value === "Poză aleasă de pe telefon" ? value : e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <PickButton label="Din galerie" onFile={onChange} onError={onError}>
          <Images className="size-4" />
        </PickButton>
        <PickButton label="Fă o poză" capture onFile={onChange} onError={onError}>
          <Camera className="size-4" />
        </PickButton>
      </div>
    </div>
  );
}

function PickButton({
  label,
  capture,
  onFile,
  onError,
  children,
}: {
  label: string;
  capture?: boolean;
  onFile: (v: string) => void;
  onError?: (msg: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-elevated px-3 text-sm font-semibold">
      {children}
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture ? "environment" : undefined}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void fileToDataUrl(file)
            .then(onFile)
            .catch(() => onError?.("Nu am putut citi poza. Încearcă alt fișier sau un link."));
        }}
      />
    </label>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  const maxEdge = 960;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    const raw = await readFile(file);
    const img = await loadImage(raw);
    return drawJpeg(img, img.width, img.height, maxEdge);
  }
  try {
    return drawJpeg(bitmap, bitmap.width, bitmap.height, maxEdge);
  } finally {
    bitmap.close();
  }
}

function drawJpeg(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  maxEdge: number,
): string {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Poză invalidă");
  ctx.drawImage(source, 0, 0, w, h);
  let quality = 0.72;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > 280_000 && quality > 0.4) {
    quality -= 0.12;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  if (out.length > 420_000) throw new Error("Poză prea mare");
  return out;
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Citire eșuată"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Poză invalidă"));
    img.src = src;
  });
}

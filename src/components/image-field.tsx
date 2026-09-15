import { adminField } from "@/components/admin/pills";

export function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div>
      {label ? <p className="text-sm font-semibold">{label}</p> : null}
      {value ? (
        <img src={value} alt="" className="mt-1 h-28 w-full rounded-xl object-cover" />
      ) : null}
      <input
        className={`${adminField} mt-1`}
        placeholder="Linkul pozei"
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
      />
      <label className="mt-2 inline-flex h-10 cursor-pointer items-center rounded-full border border-border bg-elevated px-3 text-sm font-semibold">
        Alege poza de pe telefon
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void fileToDataUrl(file).then(onChange);
          }}
        />
      </label>
    </div>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  const raw = await readFile(file);
  const img = await loadImage(raw);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
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

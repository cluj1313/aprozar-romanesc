import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LastLogin } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldLock = {
  autoComplete: "off" as const,
  autoCorrect: "off",
  autoCapitalize: "none",
  spellCheck: false,
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-form-type": "other",
};

function fieldValue(row: LastLogin, field: keyof LastLogin) {
  return row[field];
}

export function HintField({
  id,
  name,
  label,
  value,
  field,
  saved,
  placeholder,
  inputMode,
  onChange,
  onPick,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  field: keyof LastLogin;
  saved: LastLogin[];
  placeholder?: string;
  inputMode?: "email" | "tel" | "text";
  onChange: (value: string) => void;
  onPick: (row: LastLogin) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches =
    q.length < 1
      ? []
      : saved.filter((row) => {
          const hit = fieldValue(row, field).trim().toLowerCase();
          return hit.includes(q) && hit !== q;
        });

  const unique: LastLogin[] = [];
  const seen = new Set<string>();
  for (const row of matches) {
    const key = fieldValue(row, field).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= 8) break;
  }

  return (
    <div className="relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode={inputMode}
        {...fieldLock}
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && unique.length > 0 ? (
        <ul
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-elevated shadow-soft"
          role="listbox"
        >
          {unique.map((row) => {
            const main = fieldValue(row, field);
            const extra = [row.name, row.email, row.phone].filter((x) => x && x !== main).join(" · ");
            return (
              <li key={`${field}-${main}`}>
                <button
                  type="button"
                  role="option"
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start justify-center px-3 py-1.5 text-left text-sm",
                    "hover:bg-panel",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(row);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{main}</span>
                  {extra ? <span className="text-xs text-muted">{extra}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

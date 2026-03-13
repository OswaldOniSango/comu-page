"use client";

import { useId, useState } from "react";

const MAX_IMAGE_SIZE = 1024 * 1024;

type Props = {
  label: string;
  name: string;
  multiple?: boolean;
};

export function ImageUploadField({ label, name, multiple = false }: Props) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.28em] text-white/45">{label}</span>
      <input
        id={id}
        name={name}
        type="file"
        multiple={multiple}
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          const invalid = files.find((file) => file.size > MAX_IMAGE_SIZE);

          if (invalid) {
            const message = `La imagen "${invalid.name}" supera 1 MB.`;
            event.currentTarget.value = "";
            event.currentTarget.setCustomValidity(message);
            event.currentTarget.reportValidity();
            setError(message);
            return;
          }

          event.currentTarget.setCustomValidity("");
          setError(null);
        }}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-ink"
      />
      <p className="text-xs text-white/45">Maximo 1 MB por imagen.</p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

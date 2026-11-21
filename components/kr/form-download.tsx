"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/engine/types";
import type { FormKind } from "@/lib/mocks/forms/application-pdf";
import type { Persona } from "@/lib/personas/types";

export function FormDownload({ kind, persona, plan }: { kind: FormKind; persona: Persona; plan: Plan }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function download() {
    setBusy(true);
    setError(false);
    try {
      const { applicationPdf } = await import("@/lib/mocks/forms/application-pdf");
      const bytes = await applicationPdf(kind, persona, plan);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = kind === "zam" ? "ZAM-symulacja.pdf" : "wniosek-o-urlop-symulacja.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={download}
        aria-label={kind === "zam" ? "Pobierz PDF — ZAM do ZUS" : "Pobierz PDF — wniosek do pracodawcy"}>
        <Download aria-hidden />{busy ? "Przygotowuję PDF…" : "Pobierz PDF"}
      </Button>
      {error && <p role="alert" className="kr-small text-kr-danger">Nie udało się pobrać PDF. Spróbuj ponownie.</p>}
    </div>
  );
}

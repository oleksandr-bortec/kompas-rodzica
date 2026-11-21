import Link from "next/link";
import { Compass, FileSearch, PencilLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Ekran 1 — Powitanie. */
export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-10">
      <div className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-kr-primary text-white">
          <Compass className="size-6" aria-hidden />
        </span>
        <span className="font-heading text-xl font-extrabold text-kr-primary-dark">
          Kompas Rodzica
        </span>
      </div>

      <div className="mt-16 flex-1">
        <h1 className="font-heading text-[32px] font-extrabold leading-10 text-kr-text">
          Sprawdź, co Ci przysługuje — w&nbsp;3&nbsp;minuty
        </h1>
        <p className="mt-4 text-kr-text-2">
          Zasiłek, urlopy obojga rodziców, terminy i dokumenty — w jednym planie.
          Od ciąży do powrotu do pracy — z planem.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="h-14 rounded-2xl text-base">
          <Link href="/logowanie">
            <ShieldCheck aria-hidden /> Zaloguj przez mObywatel
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl text-base">
          <Link href="/dane-reczne">
            <PencilLine aria-hidden /> Wprowadź dane samodzielnie
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-14 rounded-2xl text-base text-kr-primary-dark">
          <Link href="/sprawdz-sprawe">
            <FileSearch aria-hidden /> Sprawdź przykładową sprawę
          </Link>
        </Button>
        <p className="mt-2 text-center kr-small text-kr-text-2">
          To informacja, a nie decyzja ZUS.
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Nie znaleziono strony" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-kr-primary text-white">
        <Compass className="size-7" aria-hidden />
      </span>
      <p className="mt-6 font-heading text-5xl font-extrabold text-kr-primary-dark">404</p>
      <h1 className="mt-2 kr-h1">Nie znaleźliśmy tej strony</h1>
      <p className="mt-2 text-kr-text-2">Adres mógł się zmienić. Wróć do swojego planu albo na stronę główną.</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-12 flex-1 rounded-xl"><Link href="/plan">Mój plan</Link></Button>
        <Button asChild size="lg" variant="outline" className="h-12 flex-1 rounded-xl"><Link href="/">Strona główna</Link></Button>
      </div>
    </main>
  );
}

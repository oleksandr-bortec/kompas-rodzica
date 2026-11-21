import Link from "next/link";
import { Compass } from "lucide-react";

/** Minimal shell for onboarding flows (no main navigation). */
export function FlowShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-kr-primary text-white">
            <Compass className="size-4" aria-hidden />
          </span>
          <span className="font-heading font-extrabold text-kr-primary-dark">Kompas Rodzica</span>
        </Link>
        {right}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, MonitorSmartphone, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source, Tone } from "@/lib/personas/types";

/** Card surface used across the app. */
export function Panel({
  className,
  children,
  as: Tag = "section",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article" | "li";
}) {
  return (
    <Tag className={cn("rounded-2xl border border-kr-border bg-kr-surface p-5 shadow-[0_1px_2px_rgba(29,38,36,0.04)] sm:p-6", className)}>
      {children}
    </Tag>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {back && (
          <Link href={back} className="mb-3 inline-flex items-center gap-1 kr-small font-medium text-kr-text-2 hover:text-kr-text">
            <ArrowLeft className="size-4" aria-hidden /> Wróć
          </Link>
        )}
        <h1 className="kr-h1">{title}</h1>
        {subtitle && <p className="mt-1 text-kr-text-2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Required on every imitation (mObywatel, ZUS data, e-ZLA, PUE, …). */
export function SymulacjaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-kr-warning/50 bg-[#FFF7EC] px-2 py-0.5 kr-caption text-kr-warning",
        className,
      )}
      title="To jest imitacja systemu na potrzeby prototypu"
    >
      <MonitorSmartphone className="size-3" aria-hidden /> Symulacja
    </span>
  );
}

const SOURCE: Record<Source, { label: string; cls: string }> = {
  zus: { label: "z ZUS", cls: "bg-kr-tint text-kr-primary-dark" },
  user: { label: "wpisane przez Ciebie", cls: "bg-muted text-kr-text-2" },
  ai: { label: "z dokumentu (AI)", cls: "bg-kr-partner-tint text-kr-partner" },
};

export function SourceTag({ source }: { source: Source }) {
  const s = SOURCE[source];
  return <span className={cn("rounded-full px-2 py-0.5 kr-caption", s.cls)}>{s.label}</span>;
}

const TONE: Record<Tone, { icon: typeof Info; box: string; text: string }> = {
  success: { icon: CheckCircle2, box: "border-kr-success/25 bg-[#EAF5EF]", text: "text-kr-success" },
  warning: { icon: AlertTriangle, box: "border-kr-warning/25 bg-[#FBF3E6]", text: "text-kr-warning" },
  danger: { icon: XCircle, box: "border-kr-danger/25 bg-[#FBEDEA]", text: "text-kr-danger" },
  info: { icon: Info, box: "border-kr-info/25 bg-[#EBF2FA]", text: "text-kr-info" },
};

export function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  const { icon: Icon, text } = TONE[tone];
  return <Icon className={cn("size-5 shrink-0", text, className)} aria-hidden />;
}

export function ToneBox({
  tone,
  title,
  children,
  className,
}: {
  tone: Tone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", t.box, className)} role={tone === "danger" ? "alert" : undefined}>
      <ToneIcon tone={tone} className="mt-0.5" />
      <div>
        <p className={cn("font-semibold", t.text)}>{title}</p>
        {children && <div className="mt-1 kr-small text-kr-text">{children}</div>}
      </div>
    </div>
  );
}

/** Banner shown while numbers are demo placeholders (engine not wired yet). */
export function DemoDataNote() {
  return (
    <p className="rounded-xl bg-muted px-3 py-2 kr-small text-kr-text-2">
      Kwoty przykładowe — w kolejnym kroku policzy je silnik reguł. To informacja, a nie decyzja ZUS.
    </p>
  );
}

export function Field({
  label,
  value,
  source,
  action,
}: {
  label: string;
  value: React.ReactNode;
  source?: Source;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="kr-small text-kr-text-2">{label}</p>
        <p className="font-medium text-kr-text">{value}</p>
        {source && (
          <div className="mt-1">
            <SourceTag source={source} />
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { SEGMENT_LABEL } from "@/lib/format";
export interface TimelineSegment {
  parent: "A" | "B";
  kind: string;
  startWeek: number; // may be negative (before birth)
  weeks: number;
  percent: number;
}

/** Saturation encodes payment %: 100 solid, 81.5 medium, 70 light. Label always present. */
function shade(parent: "A" | "B", percent: number) {
  const base = parent === "A" ? "14,124,102" : "91,95,199";
  const alpha = percent >= 100 ? 1 : percent >= 80 ? 0.7 : percent > 0 ? 0.35 : 0.12;
  return `rgba(${base},${alpha})`;
}

export function Timeline({
  segments,
  nameA,
  nameB,
  className,
}: {
  segments: TimelineSegment[];
  nameA: string;
  nameB?: string;
  className?: string;
}) {
  if (segments.length === 0) {
    return <p className="kr-small text-kr-text-2">Brak okresów do pokazania.</p>;
  }
  const offset = Math.min(0, ...segments.map((s) => s.startWeek));
  const total = Math.max(...segments.map((s) => s.startWeek + s.weeks), 52) - offset;
  const rows: { parent: "A" | "B"; name: string }[] = [{ parent: "A", name: nameA }];
  if (nameB && segments.some((s) => s.parent === "B")) rows.push({ parent: "B", name: nameB });
  const ticks = Array.from({ length: Math.floor((total + offset) / 13) + 1 }, (_, i) => i * 13);

  return (
    <div className={cn("space-y-4", className)}>
      {rows.map((row) => (
        <div key={row.parent}>
          <p className="mb-1.5 kr-small font-semibold" style={{ color: row.parent === "A" ? "#0A5546" : "#5B5FC7" }}>
            {row.name}
          </p>
          <div className="relative h-11 rounded-xl bg-muted">
            {segments
              .filter((s) => s.parent === row.parent)
              .map((s, i) => {
                const light = s.percent < 80;
                return (
                  <div
                    key={i}
                    className="absolute inset-y-1 flex items-center overflow-hidden rounded-lg px-2"
                    style={{
                      left: `${((s.startWeek - offset) / total) * 100}%`,
                      width: `max(${(s.weeks / total) * 100}%, 6px)`,
                      background: shade(row.parent, s.percent),
                    }}
                    title={`${SEGMENT_LABEL[s.kind] ?? s.kind} · ${s.weeks} tyg. · ${s.percent}%`}
                  >
                    <span className={cn("truncate kr-caption", light ? (row.parent === "A" ? "text-kr-primary-dark" : "text-[#3E41A0]") : "text-white")}>
                      {(SEGMENT_LABEL[s.kind] ?? s.kind).replace("Urlop ", "")} · {s.percent}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      <div className="relative h-4 kr-caption font-normal text-kr-text-2">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${((t - offset) / total) * 100}%` }}>
            {t === 0 ? "start" : `${t} tyg.`}
          </span>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 kr-small text-kr-text-2">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: shade("A", 100) }} />100%</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: shade("A", 81.5) }} />81,5%</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: shade("A", 70) }} />70%</li>
      </ul>
    </div>
  );
}

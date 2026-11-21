import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

// PNG icons for the web app manifest, generated at build time.
const VARIANTS = {
  "192": { size: 192, padding: 0.18, rounded: true },
  "512": { size: 512, padding: 0.18, rounded: true },
  // maskable: full-bleed background, content inside the 80% safe zone
  "maskable-512": { size: 512, padding: 0.28, rounded: false },
} as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const v = VARIANTS[variant as keyof typeof VARIANTS];
  if (!v) return new Response("Not found", { status: 404 });
  return new ImageResponse(<BrandIcon size={v.size} padding={v.padding} rounded={v.rounded} />, { width: v.size, height: v.size });
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sprawdź sprawę" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

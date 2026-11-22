import type { Metadata } from "next";

export const metadata: Metadata = { title: "Twoje dane z ZUS" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kilka pytań" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

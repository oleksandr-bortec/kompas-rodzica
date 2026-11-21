import { BottomNav, SideNav } from "@/components/layout/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

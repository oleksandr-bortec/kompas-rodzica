"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SymulacjaBadge } from "./ui";

/** Button that opens a simulated action (send to employer/ZUS, PUE question, …). */
export function SimAction({
  label,
  title,
  description,
  confirm = "Wyślij",
  done,
  variant = "default",
  children,
}: {
  label: React.ReactNode;
  title: string;
  description: string;
  confirm?: string;
  done: string;
  variant?: "default" | "outline" | "secondary";
  children?: React.ReactNode;
}) {
  const [sent, setSent] = useState(false);
  return (
    <Dialog onOpenChange={(o) => !o && setSent(false)}>
      <DialogTrigger asChild>
        <Button variant={variant} className="rounded-xl">{label}</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <div className="mb-1"><SymulacjaBadge /></div>
          <DialogTitle className="font-heading">{sent ? "Gotowe" : title}</DialogTitle>
          <DialogDescription>{sent ? done : description}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#EAF5EF] p-3 text-kr-success">
            <CheckCircle2 className="size-5" aria-hidden /> Status: wysłano (symulacja)
          </div>
        ) : (
          children
        )}
        {!sent && (
          <DialogFooter>
            <Button className="h-11 rounded-xl" onClick={() => setSent(true)}>{confirm}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

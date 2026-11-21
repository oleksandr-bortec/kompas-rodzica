"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PERSONA_ID, getPersona } from "@/lib/personas/data";
import type { Persona } from "@/lib/personas/types";

const KEY = "kr.persona";

interface Ctx {
  persona: Persona;
  setPersonaId: (id: Persona["id"]) => void;
}

const PersonaContext = createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<Persona["id"]>(DEFAULT_PERSONA_ID);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setId(getPersona(saved).id);
    } catch {}
  }, []);

  const setPersonaId = (next: Persona["id"]) => {
    setId(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };

  return (
    <PersonaContext.Provider value={{ persona: getPersona(id), setPersonaId }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}

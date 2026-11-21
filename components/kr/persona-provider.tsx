"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PERSONA_ID, getPersona } from "@/lib/personas/data";
import { customPersona, type ManualFields } from "@/lib/personas/manual-entry";
import type { DemoPersona, Persona } from "@/lib/personas/types";

const KEY = "kr.persona";
const CUSTOM_KEY = "kr.custom";

interface Ctx {
  persona: Persona;
  manualFields: ManualFields | null;
  setPersonaId: (id: DemoPersona["id"]) => void;
  saveCustom: (fields: ManualFields) => void;
}

const PersonaContext = createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>(getPersona(DEFAULT_PERSONA_ID));
  const [manualFields, setManualFields] = useState<ManualFields | null>(null);

  useEffect(() => {
    try {
      const active = localStorage.getItem(KEY);
      setPersona(getPersona(active));
      const saved = localStorage.getItem(CUSTOM_KEY);
      if (saved) {
        const fields = JSON.parse(saved);
        const custom = customPersona(fields);
        setManualFields(fields);
        if (active === "custom") setPersona(custom);
      }
    } catch { /* Unavailable storage or an invalid saved profile. */ }
  }, []);

  function setPersonaId(id: DemoPersona["id"]) {
    setPersona(getPersona(id));
    try { localStorage.setItem(KEY, id); } catch {}
  }

  function saveCustom(fields: ManualFields) {
    const custom = customPersona(fields);
    setManualFields(fields);
    setPersona(custom);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(fields));
      localStorage.setItem(KEY, custom.id);
    } catch { /* The entered plan remains available during this visit. */ }
  }

  return (
    <PersonaContext.Provider value={{ persona, manualFields, setPersonaId, saveCustom }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}

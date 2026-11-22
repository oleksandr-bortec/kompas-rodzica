"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PERSONA_ID, getPersona } from "@/lib/personas/data";
import { customPersona, type ManualFields } from "@/lib/personas/manual-entry";
import { applyAnswers, type OnboardingAnswers } from "@/lib/personas/answers";
import { loadRuntimeParams } from "@/lib/engine/params/runtime";
import type { DemoPersona, Persona } from "@/lib/personas/types";

const KEY = "kr.persona";
const CUSTOM_KEY = "kr.custom";
const ANSWERS_KEY = "kr.answers";

interface Ctx {
  /** Persona with onboarding answers applied — use this everywhere. */
  persona: Persona;
  /** Persona exactly as delivered by (simulated) ZUS data, before answers. */
  basePersona: Persona;
  manualFields: ManualFields | null;
  /** Prefill for the manual form (e.g. „Popraw” on ZUS data), not saved yet. */
  draftFields: ManualFields | null;
  answers: OnboardingAnswers | undefined;
  /** Bumps when parameter versions from the admin panel are (re)loaded — recompute plans. */
  paramsRevision: number;
  setPersonaId: (id: DemoPersona["id"]) => void;
  saveCustom: (fields: ManualFields) => void;
  saveAnswers: (answers: OnboardingAnswers) => void;
  setDraftFields: (fields: ManualFields | null) => void;
}

const PersonaContext = createContext<Ctx | null>(null);

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [basePersona, setBasePersona] = useState<Persona>(getPersona(DEFAULT_PERSONA_ID));
  const [manualFields, setManualFields] = useState<ManualFields | null>(null);
  const [draftFields, setDraftFields] = useState<ManualFields | null>(null);
  const [allAnswers, setAllAnswers] = useState<Record<string, OnboardingAnswers>>({});
  // Hide content until saved state (persona, answers, admin parameters) is restored,
  // so the default persona never flashes.
  const [ready, setReady] = useState(false);
  const [paramsRevision, setParamsRevision] = useState(0);

  useEffect(() => {
    loadRuntimeParams();
    setParamsRevision((r) => r + 1);
    try {
      const active = localStorage.getItem(KEY);
      setBasePersona(getPersona(active));
      setAllAnswers(readJson<Record<string, OnboardingAnswers>>(ANSWERS_KEY) ?? {});
      const saved = readJson<ManualFields>(CUSTOM_KEY);
      if (saved) {
        const custom = customPersona(saved);
        setManualFields(saved);
        if (active === "custom") setBasePersona(custom);
      }
    } catch { /* Unavailable storage or an invalid saved profile. */ }
    setReady(true);
  }, []);

  function setPersonaId(id: DemoPersona["id"]) {
    setBasePersona(getPersona(id));
    try { localStorage.setItem(KEY, id); } catch {}
  }

  function saveCustom(fields: ManualFields) {
    const custom = customPersona(fields);
    setManualFields(fields);
    setDraftFields(null);
    setBasePersona(custom);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(fields));
      localStorage.setItem(KEY, custom.id);
    } catch { /* The entered plan remains available during this visit. */ }
  }

  function saveAnswers(answers: OnboardingAnswers) {
    const next = { ...allAnswers, [basePersona.id]: answers };
    setAllAnswers(next);
    try { localStorage.setItem(ANSWERS_KEY, JSON.stringify(next)); } catch {}
  }

  const answers = basePersona.id === "custom" ? undefined : allAnswers[basePersona.id];
  const persona: Persona = basePersona.id === "custom" ? basePersona : applyAnswers(basePersona, answers);

  return (
    <PersonaContext.Provider
      value={{ persona, basePersona, manualFields, draftFields, answers, paramsRevision, setPersonaId, saveCustom, saveAnswers, setDraftFields }}
    >
      <div style={ready ? undefined : { opacity: 0 }}>{children}</div>
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}

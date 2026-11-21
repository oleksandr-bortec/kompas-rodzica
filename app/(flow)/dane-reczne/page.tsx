"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { FlowShell } from "@/components/kr/flow-shell";
import { SourceTag } from "@/components/kr/ui";
import { usePersona } from "@/components/kr/persona-provider";
import { Button } from "@/components/ui/button";
import { manualEntrySchema, type ManualFields } from "@/lib/personas/manual-entry";

const control = "block h-12 w-full min-w-0 max-w-full rounded-xl border border-kr-border bg-white px-3 text-base text-kr-text focus-visible:outline-2 focus-visible:outline-kr-primary";
const group = "min-w-0 space-y-4 rounded-2xl border border-kr-border bg-kr-surface px-4 pb-5 pt-2";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {error && <span role="alert" className="block text-sm text-kr-danger">{error}</span>}
    </label>
  );
}

function ParentFields({ who }: { who: "parentA" | "parentB" }) {
  const { register, formState: { errors } } = useFormContext<ManualFields>();
  const err = errors[who];
  return (
    <fieldset className={group}>
      <legend className="px-1 kr-card-title">{who === "parentA" ? "Twoje ubezpieczenie" : "Ubezpieczenie drugiego rodzica"}</legend>
      <Field label="Tytuł ubezpieczenia" error={err?.title?.message}>
        <select {...register(`${who}.title`)} className={control} defaultValue="">
          <option value="" disabled>Wybierz tytuł</option>
          <option value="umowa_o_prace">Umowa o pracę</option>
          <option value="umowa_zlecenie">Umowa zlecenie</option>
          <option value="jdg">Działalność gospodarcza</option>
          <option value="inne">Inny tytuł</option>
        </select>
      </Field>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Od kiedy trwa ubezpieczenie?" error={err?.from?.message}>
          <input type="date" {...register(`${who}.from`)} className={control} />
        </Field>
        <Field label="Do kiedy? (pomiń, jeśli trwa)" error={err?.to?.message}>
          <input type="date" {...register(`${who}.to`)} className={control} />
        </Field>
      </div>
      <Field label="Ubezpieczenie chorobowe" error={err?.sickness?.message}>
        <select {...register(`${who}.sickness`)} defaultValue="" className={control}>
          <option value="" disabled>Wybierz rodzaj</option>
          <option value="obowiazkowe">Obowiązkowe</option>
          <option value="dobrowolne">Dobrowolne</option>
          <option value="brak">Brak</option>
        </select>
      </Field>
      <Field label="Liczba ubezpieczonych u płatnika na 30 listopada poprzedniego roku (opcjonalnie)" error={err?.payerInsuredCount?.message}>
        <input inputMode="numeric" {...register(`${who}.payerInsuredCount`)} className={control} />
      </Field>
      <Field label="Miesięczna podstawa wymiaru zasiłku w zł (opcjonalnie)" error={err?.base?.message}>
        <input inputMode="decimal" {...register(`${who}.base`)} className={control} />
      </Field>
    </fieldset>
  );
}

function ManualForm({ saved }: { saved: ManualFields | null }) {
  const router = useRouter();
  const { saveCustom } = usePersona();
  const [partner, setPartner] = useState(!!saved?.parentB);
  const methods = useForm<ManualFields>({
    defaultValues: saved ?? { event: "porod", children: "1" },
    shouldUnregister: true,
    resolver: zodResolver(manualEntrySchema, { error: () => "Sprawdź wartość tego pola." }, { raw: true }),
  });
  const { register, watch, handleSubmit, formState: { errors } } = methods;
  const adoption = watch("event") === "adopcja";
  return (
    <FormProvider {...methods}>
      <form noValidate className="mt-6 space-y-5" onSubmit={handleSubmit(fields => {
        saveCustom(fields);
        router.push("/plan");
      })}>
        <fieldset className={group}>
          <legend className="px-1 kr-card-title">Dane dziecka</legend>
          <Field label="Zdarzenie" error={errors.event?.message}>
            <select {...register("event")} className={control}>
              <option value="porod">Poród</option>
              <option value="adopcja">Adopcja</option>
            </select>
          </Field>
          <Field label={adoption ? "Data przyjęcia dziecka" : "Termin porodu"} error={errors.eventDate?.message}>
            <input type="date" {...register("eventDate")} className={control} />
          </Field>
          <Field label="Liczba dzieci" error={errors.children?.message}>
            <input inputMode="numeric" {...register("children")} className={control} />
          </Field>
          {adoption && <Field label="Wiek dziecka w pełnych latach (opcjonalnie)" error={errors.childAgeYears?.message}>
            <input inputMode="numeric" {...register("childAgeYears")} className={control} />
          </Field>}
        </fieldset>
        <ParentFields who="parentA" />
        <label className="flex min-h-12 items-center gap-3 font-medium">
          <input type="checkbox" className="size-5 accent-kr-primary" checked={partner} onChange={e => setPartner(e.target.checked)} />
          Uwzględnij drugiego rodzica
        </label>
        {partner && <ParentFields who="parentB" />}
        <Button type="submit" size="lg" className="h-14 w-full rounded-2xl text-base">Zapisz i zobacz plan</Button>
      </form>
    </FormProvider>
  );
}

export default function ManualEntryPage() {
  const { manualFields } = usePersona();
  return (
    <FlowShell>
      <h1 className="kr-h1">Wprowadź dane samodzielnie</h1>
      <p className="my-2 text-kr-text-2">Na podstawie tych danych obliczymy Twój plan. Zapiszemy je w tej przeglądarce.</p>
      <div><SourceTag source="user" /></div>
      <ManualForm key={manualFields ? "saved" : "new"} saved={manualFields} />
    </FlowShell>
  );
}

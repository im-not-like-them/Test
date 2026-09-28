"use client";

import { useActionState, useState } from "react";
import { Button, Field, Flash, Input, Select } from "@/components/ui";
import { createEstablishment, type SignupState } from "./actions";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function SignupForm({ rootDomain }: { rootDomain: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(createEstablishment, {});
  const v = state.values ?? {};
  const [slug, setSlug] = useState(v.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="space-y-6">
      <Flash error={state.error} />

      <fieldset className="space-y-4">
        <legend className="mb-2 font-semibold">Votre établissement</legend>
        <Field label="Nom de l'établissement">
          <Input
            name="name"
            required
            defaultValue={v.name}
            placeholder="Université des Lagunes"
            onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
          />
        </Field>
        <Field label="Adresse de votre plateforme" hint={`${slug || "monecole"}.${rootDomain}`}>
          <Input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select name="type" defaultValue={v.type ?? "UNIVERSITE"}>
              <option value="UNIVERSITE">Université</option>
              <option value="GRANDE_ECOLE">Grande école / Institut</option>
              <option value="SECONDAIRE">Lycée / Collège</option>
            </Select>
          </Field>
          <Field label="Statut">
            <Select name="sector" defaultValue={v.sector ?? "PRIVE"}>
              <option value="PRIVE">Privé</option>
              <option value="PUBLIC">Public</option>
            </Select>
          </Field>
          <Field label="Ville">
            <Input name="city" required defaultValue={v.city ?? "Abidjan"} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-semibold">Compte administrateur</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom">
            <Input name="firstName" required defaultValue={v.firstName} />
          </Field>
          <Field label="Nom">
            <Input name="lastName" required defaultValue={v.lastName} />
          </Field>
        </div>
        <Field label="E-mail">
          <Input name="email" type="email" required defaultValue={v.email} />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum.">
          <Input name="password" type="password" required minLength={8} />
        </Field>
      </fieldset>

      <Button type="submit" disabled={pending} className="w-full py-3">
        {pending ? "Création…" : "Créer ma plateforme"}
      </Button>
    </form>
  );
}

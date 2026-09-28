"use client";

import { useActionState } from "react";
import { Button, Card, Field, Flash, Input, Select } from "@/components/ui";
import { createUser, importUsers, type CreatedAccount, type UsersActionState } from "./actions";

type ClassOption = { id: string; name: string };

function downloadCsv(accounts: CreatedAccount[]) {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = ["nom;email;mot_de_passe;classe", ...accounts.map((a) => [a.name, a.email, a.password, a.classGroup ?? ""].map(escape).join(";"))];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "identifiants.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function Results({ state }: { state: UsersActionState }) {
  if (state.error) return <Flash error={state.error} />;
  if (!state.created && !state.errors) return null;
  const created = state.created ?? [];
  return (
    <div className="mt-4 space-y-3">
      {created.length > 0 && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{created.length} compte(s) créé(s). Notez les mots de passe : ils ne seront plus affichés.</p>
            <Button type="button" variant="secondary" className="shrink-0 px-2 py-1 text-xs" onClick={() => downloadCsv(created)}>
              Télécharger
            </Button>
          </div>
          <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto font-mono text-xs">
            {created.map((a) => (
              <li key={a.email}>
                {a.email} — <strong>{a.password}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      {state.errors && state.errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">{state.errors.length} ligne(s) ignorée(s) :</p>
          <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs">
            {state.errors.map((e) => (
              <li key={`${e.line}-${e.message}`}>Ligne {e.line} : {e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CreateUserForm({ classes, studentLabel }: { classes: ClassOption[]; studentLabel: string }) {
  const [state, action, pending] = useActionState(createUser, {});
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Ajouter un utilisateur</h2>
      <form action={action} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom"><Input name="firstName" required /></Field>
          <Field label="Nom"><Input name="lastName" required /></Field>
        </div>
        <Field label="E-mail"><Input name="email" type="email" required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rôle">
            <Select name="role" defaultValue="STUDENT">
              <option value="STUDENT">{studentLabel}</option>
              <option value="TEACHER">Enseignant</option>
              <option value="ADMIN">Administration</option>
            </Select>
          </Field>
          <Field label="Matricule"><Input name="matricule" /></Field>
        </div>
        {classes.length > 0 && (
          <Field label="Classe (élèves/étudiants)">
            <Select name="classGroupId" defaultValue="">
              <option value="">—</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Création…" : "Créer le compte"}</Button>
      </form>
      <Results state={state} />
    </Card>
  );
}

export function ImportUsersForm() {
  const [state, action, pending] = useActionState(importUsers, {});
  return (
    <Card>
      <h2 className="mb-1 font-semibold">Importer depuis Excel (CSV)</h2>
      <p className="mb-3 text-xs text-stone-500">
        Colonnes : <code>prenom;nom;email;role;matricule;classe</code>. Rôle : etudiant, eleve, enseignant ou admin. Classe : code de la classe.
      </p>
      <form action={action} className="space-y-3">
        <Input name="file" type="file" accept=".csv,text/csv" required />
        <Button type="submit" disabled={pending} variant="secondary" className="w-full">{pending ? "Import en cours…" : "Importer"}</Button>
      </form>
      <Results state={state} />
    </Card>
  );
}

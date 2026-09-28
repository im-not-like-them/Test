"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generatePassword, hashPassword, requireUser } from "@/lib/auth";
import { parseUsersCsv, type ImportError } from "@/lib/csv";
import { isUniqueViolation, tenantDb } from "@/lib/db";
import { back } from "@/lib/flash";

export type CreatedAccount = { name: string; email: string; password: string; classGroup: string | null };
export type UsersActionState = { error?: string; created?: CreatedAccount[]; errors?: ImportError[] };

const MAX_IMPORT_ROWS = 2000;

const userSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom obligatoire.").max(100),
  lastName: z.string().trim().min(1, "Nom obligatoire.").max(100),
  email: z.string().trim().toLowerCase().email("E-mail invalide."),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  matricule: z.string().trim().max(50).optional().transform((s) => s || null),
  classGroupId: z.string().optional().transform((s) => s || null),
});

export async function createUser(_prev: UsersActionState, form: FormData): Promise<UsersActionState> {
  const { tenant } = await requireUser(["ADMIN"]);
  const db = tenantDb(tenant.id);
  const parsed = userSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { classGroupId, ...data } = parsed.data;

  const classGroup = classGroupId ? await db.classGroup.findFirst({ where: { id: classGroupId } }) : null;
  if (classGroupId && !classGroup) return { error: "Classe introuvable." };

  const password = generatePassword();
  try {
    const user = await db.user.create({ data: { ...data, tenantId: tenant.id, passwordHash: await hashPassword(password) } });
    if (classGroup && data.role === "STUDENT") {
      await db.enrollment.create({ data: { tenantId: tenant.id, userId: user.id, classGroupId: classGroup.id } });
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Un compte existe déjà avec cet e-mail ou ce matricule." };
    throw error;
  }
  revalidatePath("/espace", "layout");
  return {
    created: [{ name: `${data.firstName} ${data.lastName}`, email: data.email, password, classGroup: classGroup?.name ?? null }],
  };
}

export async function importUsers(_prev: UsersActionState, form: FormData): Promise<UsersActionState> {
  const { tenant } = await requireUser(["ADMIN"]);
  const db = tenantDb(tenant.id);

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez un fichier CSV." };
  if (file.size > 2_000_000) return { error: "Fichier trop volumineux (2 Mo maximum)." };

  const { rows, errors } = parseUsersCsv(await file.text());
  if (rows.length > MAX_IMPORT_ROWS) return { error: `${MAX_IMPORT_ROWS} lignes maximum par import.` };

  const [existing, classes] = await Promise.all([
    db.user.findMany({ where: { email: { in: rows.map((r) => r.email) } }, select: { email: true } }),
    db.classGroup.findMany({ where: { academicYear: { isCurrent: true } }, select: { id: true, code: true, name: true } }),
  ]);
  const taken = new Set(existing.map((u) => u.email));
  const classByCode = new Map(classes.map((c) => [c.code.toUpperCase(), c]));

  const created: CreatedAccount[] = [];
  for (const row of rows) {
    if (taken.has(row.email)) {
      errors.push({ line: row.line, message: `Compte déjà existant : ${row.email}.` });
      continue;
    }
    const classGroup = row.classCode ? classByCode.get(row.classCode.toUpperCase()) : undefined;
    if (row.classCode && !classGroup) {
      errors.push({ line: row.line, message: `Classe inconnue pour l'année en cours : « ${row.classCode} ».` });
      continue;
    }

    const password = generatePassword();
    try {
      const user = await db.user.create({
        data: {
          tenantId: tenant.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          role: row.role,
          matricule: row.matricule,
          passwordHash: await hashPassword(password),
        },
      });
      if (classGroup && row.role === "STUDENT") {
        await db.enrollment.create({ data: { tenantId: tenant.id, userId: user.id, classGroupId: classGroup.id } });
      }
      created.push({ name: `${row.firstName} ${row.lastName}`, email: row.email, password, classGroup: classGroup?.name ?? null });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      errors.push({ line: row.line, message: `Matricule déjà utilisé : ${row.matricule}.` });
    }
  }

  errors.sort((a, b) => a.line - b.line);
  revalidatePath("/espace", "layout");
  return { created, errors };
}

export async function deleteUser(form: FormData) {
  const { user, tenant } = await requireUser(["ADMIN"]);
  const id = String(form.get("id") ?? "");
  if (id === user.id) return back("/espace/utilisateurs", { erreur: "Vous ne pouvez pas supprimer votre propre compte." });
  const { count } = await tenantDb(tenant.id).user.deleteMany({ where: { id } });
  revalidatePath("/espace", "layout");
  return back("/espace/utilisateurs", count ? { ok: "Compte supprimé." } : { erreur: "Compte introuvable." });
}

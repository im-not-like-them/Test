"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isUniqueViolation, tenantDb } from "@/lib/db";
import { back } from "@/lib/flash";

const PATH = "/espace/structure";
const code = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{0,19}$/, "Code invalide : lettres, chiffres, - ou _ (20 caractères max).");
const name = z.string().trim().min(2, "Nom trop court.").max(150);
const optional = z.string().trim().max(2000).optional().transform((s) => s || null);

async function admin() {
  const { tenant } = await requireUser(["ADMIN"]);
  return { db: tenantDb(tenant.id), tenantId: tenant.id };
}

async function parse<T extends z.ZodTypeAny>(schema: T, form: FormData): Promise<z.infer<T>> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(PATH, { erreur: parsed.error.issues[0]!.message });
  return parsed.data;
}

async function save(fn: () => Promise<unknown>, success: string): Promise<never> {
  try {
    await fn();
  } catch (error) {
    if (isUniqueViolation(error)) return back(PATH, { erreur: "Ce code est déjà utilisé." });
    throw error;
  }
  revalidatePath("/", "layout");
  return back(PATH, { ok: success });
}

export async function createUnit(form: FormData) {
  const { db, tenantId } = await admin();
  const data = await parse(z.object({ code, name, description: optional }), form);
  await save(() => db.unit.create({ data: { ...data, tenantId } }), `« ${data.name} » ajouté.`);
}

export async function createProgram(form: FormData) {
  const { db, tenantId } = await admin();
  const data = await parse(z.object({ code, name, unitId: z.string().min(1), degree: optional, description: optional }), form);
  if (!(await db.unit.count({ where: { id: data.unitId } }))) return back(PATH, { erreur: "Composante introuvable." });
  await save(() => db.program.create({ data: { ...data, tenantId } }), `« ${data.name} » ajoutée.`);
}

export async function createClassGroup(form: FormData) {
  const { db, tenantId } = await admin();
  const data = await parse(
    z.object({ code, name, level: z.string().trim().min(1, "Niveau obligatoire.").max(30), programId: z.string().min(1) }),
    form,
  );
  const [program, year] = await Promise.all([
    db.program.count({ where: { id: data.programId } }),
    db.academicYear.findFirst({ where: { isCurrent: true } }),
  ]);
  if (!program) return back(PATH, { erreur: "Filière introuvable." });
  if (!year) return back(PATH, { erreur: "Définissez d'abord l'année académique en cours." });
  await save(() => db.classGroup.create({ data: { ...data, tenantId, academicYearId: year.id } }), `« ${data.name} » ajoutée.`);
}

// Suppression uniquement des éléments vides, pour éviter d'effacer par erreur
// des classes entières avec leurs inscriptions.
export async function deleteNode(form: FormData) {
  const { db } = await admin();
  const id = String(form.get("id") ?? "");
  const kind = String(form.get("kind") ?? "");

  if (kind === "unit") {
    if (await db.program.count({ where: { unitId: id } })) return back(PATH, { erreur: "Supprimez d'abord ses filières." });
    await db.unit.deleteMany({ where: { id } });
  } else if (kind === "program") {
    if (await db.classGroup.count({ where: { programId: id } })) return back(PATH, { erreur: "Supprimez d'abord ses classes." });
    await db.program.deleteMany({ where: { id } });
  } else if (kind === "class") {
    if (await db.enrollment.count({ where: { classGroupId: id } })) return back(PATH, { erreur: "Cette classe a des inscrits, retirez-les d'abord." });
    await db.classGroup.deleteMany({ where: { id } });
  } else {
    return back(PATH, { erreur: "Élément inconnu." });
  }
  revalidatePath("/", "layout");
  return back(PATH, { ok: "Élément supprimé." });
}

export async function setAcademicYear(form: FormData) {
  const { db, tenantId } = await admin();
  const { label } = await parse(z.object({ label: z.string().trim().regex(/^\d{4}-\d{4}$/, "Format attendu : 2025-2026.") }), form);
  const [start, end] = label.split("-").map(Number);
  if (end !== start! + 1) return back(PATH, { erreur: "Les deux années doivent se suivre (ex. 2025-2026)." });

  const year = (await db.academicYear.findFirst({ where: { label } })) ?? (await db.academicYear.create({ data: { label, tenantId } }));
  await db.$transaction([
    db.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
    db.academicYear.updateMany({ where: { id: year.id }, data: { isCurrent: true } }),
  ]);
  revalidatePath("/", "layout");
  return back(PATH, { ok: `Année en cours : ${label}.` });
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isUniqueViolation, tenantDb } from "@/lib/db";
import { back } from "@/lib/flash";

async function adminForClass(form: FormData) {
  const { tenant } = await requireUser(["ADMIN"]);
  const db = tenantDb(tenant.id);
  const classGroupId = String(form.get("classGroupId") ?? "");
  const classGroup = await db.classGroup.findFirst({ where: { id: classGroupId } });
  if (!classGroup) return back("/espace/classes", { erreur: "Classe introuvable." });
  return { db, classGroup, path: `/espace/classes/${classGroup.id}` };
}

const courseSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Code obligatoire.").max(20),
  title: z.string().trim().min(2, "Intitulé trop court.").max(150),
  weight: z.coerce.number().int().min(0).max(60).optional().or(z.literal("").transform(() => undefined)),
  semester: z.coerce.number().int().min(1).max(12).optional().or(z.literal("").transform(() => undefined)),
  teacherId: z.string().optional().transform((s) => s || null),
});

export async function addCourse(form: FormData) {
  const { db, classGroup, path } = await adminForClass(form);
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(path, { erreur: parsed.error.issues[0]!.message });
  const { teacherId, ...data } = parsed.data;

  if (teacherId && !(await db.user.count({ where: { id: teacherId, role: "TEACHER" } }))) {
    return back(path, { erreur: "Enseignant introuvable." });
  }
  try {
    await db.course.create({ data: { ...data, teacherId, tenantId: classGroup.tenantId, classGroupId: classGroup.id } });
  } catch (error) {
    if (isUniqueViolation(error)) return back(path, { erreur: "Ce code de cours existe déjà dans cette classe." });
    throw error;
  }
  revalidatePath(path);
  return back(path, { ok: "Cours ajouté." });
}

export async function assignTeacher(form: FormData) {
  const { db, classGroup, path } = await adminForClass(form);
  const courseId = String(form.get("courseId") ?? "");
  const teacherId = String(form.get("teacherId") ?? "") || null;
  if (teacherId && !(await db.user.count({ where: { id: teacherId, role: "TEACHER" } }))) {
    return back(path, { erreur: "Enseignant introuvable." });
  }
  await db.course.updateMany({ where: { id: courseId, classGroupId: classGroup.id }, data: { teacherId } });
  revalidatePath(path);
  return back(path, { ok: "Enseignant mis à jour." });
}

export async function removeCourse(form: FormData) {
  const { db, classGroup, path } = await adminForClass(form);
  await db.course.deleteMany({ where: { id: String(form.get("courseId") ?? ""), classGroupId: classGroup.id } });
  revalidatePath(path);
  return back(path, { ok: "Cours supprimé." });
}

export async function enrollStudent(form: FormData) {
  const { db, classGroup, path } = await adminForClass(form);
  const query = String(form.get("student") ?? "").trim();
  if (!query) return back(path, { erreur: "Indiquez un e-mail ou un matricule." });

  const student = await db.user.findFirst({
    where: { role: "STUDENT", OR: [{ email: query.toLowerCase() }, { matricule: query }] },
  });
  if (!student) return back(path, { erreur: `Aucun élève/étudiant trouvé pour « ${query} ».` });
  try {
    await db.enrollment.create({ data: { tenantId: classGroup.tenantId, userId: student.id, classGroupId: classGroup.id } });
  } catch (error) {
    if (isUniqueViolation(error)) return back(path, { erreur: "Déjà inscrit dans cette classe." });
    throw error;
  }
  revalidatePath(path);
  return back(path, { ok: `${student.firstName} ${student.lastName} inscrit(e).` });
}

export async function unenrollStudent(form: FormData) {
  const { db, classGroup, path } = await adminForClass(form);
  await db.enrollment.deleteMany({ where: { userId: String(form.get("userId") ?? ""), classGroupId: classGroup.id } });
  revalidatePath(path);
  return back(path, { ok: "Inscription retirée." });
}

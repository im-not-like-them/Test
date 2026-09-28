"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canPostInClass } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import { back } from "@/lib/flash";

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court.").max(200),
  body: z.string().trim().min(3, "Message trop court.").max(10_000),
  classGroupId: z.string().optional(),
  isPublic: z.literal("on").optional(),
  redirectTo: z.enum(["/espace", "/espace/classes"]).or(z.string().regex(/^\/espace\/classes\/[a-z0-9]+$/)),
});

// Publie une annonce : à toute l'école (administration uniquement) ou à une classe.
export async function postAnnouncement(form: FormData) {
  const { user, tenant } = await requireUser(["ADMIN", "TEACHER"]);
  const db = tenantDb(tenant.id);
  const parsed = announcementSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back("/espace", { erreur: parsed.error.issues[0]!.message });
  const { title, body, classGroupId, isPublic, redirectTo } = parsed.data;

  if (classGroupId) {
    if (!(await canPostInClass(db, user, classGroupId))) return back(redirectTo, { erreur: "Accès refusé à cette classe." });
  } else if (user.role !== "ADMIN") {
    return back(redirectTo, { erreur: "Seule l'administration peut publier une annonce générale." });
  }

  await db.announcement.create({
    data: {
      tenantId: tenant.id,
      title,
      body,
      authorId: user.id,
      classGroupId: classGroupId || null,
      // Seules les annonces générales peuvent apparaître sur le site public.
      isPublic: !classGroupId && isPublic === "on",
    },
  });
  revalidatePath("/", "layout");
  return back(redirectTo, { ok: "Annonce publiée." });
}

export async function deleteAnnouncement(form: FormData) {
  const { user, tenant } = await requireUser(["ADMIN", "TEACHER"]);
  const db = tenantDb(tenant.id);
  const id = String(form.get("id") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/espace");
  const safeRedirect = /^\/espace(\/classes(\/[a-z0-9]+)?)?$/.test(redirectTo) ? redirectTo : "/espace";

  // L'administration supprime toute annonce, un enseignant seulement les siennes.
  const where = user.role === "ADMIN" ? { id } : { id, authorId: user.id };
  const { count } = await db.announcement.deleteMany({ where });
  revalidatePath("/", "layout");
  return back(safeRedirect, count ? { ok: "Annonce supprimée." } : { erreur: "Annonce introuvable." });
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isUniqueViolation, prisma } from "@/lib/db";
import { back } from "@/lib/flash";
import { rootDomain } from "@/lib/hosts";
import { isHexColor } from "@/lib/theme";

const PATH = "/espace/parametres";
const optional = (max: number) => z.string().trim().max(max).optional().transform((s) => s || null);
const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const schema = z.object({
  name: z.string().trim().min(3, "Nom trop court.").max(150),
  tagline: optional(200),
  about: optional(5000),
  city: z.string().trim().min(2).max(80),
  sector: z.enum(["PUBLIC", "PRIVE"]),
  logoUrl: optional(500).refine((s) => !s || /^https:\/\//.test(s), "Le logo doit être une adresse https://."),
  primaryColor: z.string().refine(isHexColor, "Couleur principale invalide."),
  accentColor: z.string().refine(isHexColor, "Couleur secondaire invalide."),
  contactEmail: optional(200).refine((s) => !s || z.string().email().safeParse(s).success, "E-mail de contact invalide."),
  contactPhone: optional(40),
  customDomain: optional(253)
    .transform((s) => s?.toLowerCase() ?? null)
    .refine((s) => !s || HOSTNAME_RE.test(s), "Domaine invalide (ex. portail.monuniversite.ci).")
    .refine((s) => !s || !s.endsWith(rootDomain().replace(/:\d+$/, "")), "Utilisez votre propre domaine, pas celui de la plateforme."),
});

export async function updateSettings(form: FormData) {
  const { tenant } = await requireUser(["ADMIN"]);
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(PATH, { erreur: parsed.error.issues[0]!.message });

  try {
    await prisma.tenant.update({ where: { id: tenant.id }, data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return back(PATH, { erreur: "Ce domaine est déjà utilisé par un autre établissement." });
    throw error;
  }
  revalidatePath("/", "layout");
  return back(PATH, { ok: "Modifications enregistrées." });
}

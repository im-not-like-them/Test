"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma, isUniqueViolation } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isValidSlug, tenantUrl } from "@/lib/hosts";
import { currentAcademicYearLabel } from "@/lib/academic-year";

const schema = z.object({
  name: z.string().trim().min(3, "Nom de l'établissement trop court."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "Adresse invalide : lettres minuscules, chiffres et tirets (2 à 40 caractères)."),
  type: z.enum(["UNIVERSITE", "GRANDE_ECOLE", "SECONDAIRE"]),
  sector: z.enum(["PUBLIC", "PRIVE"]),
  city: z.string().trim().min(2, "Ville obligatoire."),
  firstName: z.string().trim().min(1, "Prénom obligatoire."),
  lastName: z.string().trim().min(1, "Nom obligatoire."),
  email: z.string().trim().toLowerCase().email("E-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

export type SignupState = { error?: string; values?: Record<string, string> };

export async function createEstablishment(_prev: SignupState, form: FormData): Promise<SignupState> {
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const parsed = schema.safeParse(values);
  const { password: _pw, ...safeValues } = values;
  if (!parsed.success) return { error: parsed.error.issues[0]!.message, values: safeValues };
  const d = parsed.data;

  try {
    await prisma.tenant.create({
      data: {
        name: d.name,
        slug: d.slug,
        type: d.type,
        sector: d.sector,
        city: d.city,
        contactEmail: d.email,
        users: {
          create: {
            email: d.email,
            firstName: d.firstName,
            lastName: d.lastName,
            role: "ADMIN",
            passwordHash: await hashPassword(d.password),
          },
        },
        academicYears: { create: { label: currentAcademicYearLabel(), isCurrent: true } },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Cette adresse est déjà prise, choisissez-en une autre.", values: safeValues };
    throw error;
  }

  redirect(tenantUrl(d.slug, "/connexion?ok=" + encodeURIComponent("Votre établissement est créé. Connectez-vous.")));
}

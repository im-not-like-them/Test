import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { Role, Tenant, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redirectTo } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

const COOKIE = "kalanso_session";
const SESSION_DAYS = 30;

// Pas d'attribut Domain : le cookie reste propre à l'hôte de l'établissement,
// une session ouverte sur ul.kalanso.ci n'est jamais envoyée à horizon.kalanso.ci.

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generatePassword(): string {
  // Sans caractères ambigus (0/O, 1/l/I) pour être dicté ou recopié facilement.
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.PROTOCOL === "https",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

/** Utilisateur connecté pour l'établissement courant, ou null. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const tenant = await currentTenant();
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  // Une session n'est valable que sur l'établissement de son utilisateur.
  if (session.user.tenantId !== tenant.id) return null;
  return session.user;
});

export async function requireUser(roles?: Role[]): Promise<{ user: User; tenant: Tenant }> {
  const tenant = await currentTenant();
  const user = await currentUser();
  if (!user) return redirectTo("/connexion");
  if (roles && !roles.includes(user.role)) return redirectTo("/espace");
  return { user, tenant };
}

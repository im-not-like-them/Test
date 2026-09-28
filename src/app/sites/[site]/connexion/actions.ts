"use server";

import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import { back, redirectTo } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";

// Empreinte bcrypt factice : on compare même si l'e-mail est inconnu, pour ne pas
// révéler par le temps de réponse quels comptes existent.
const DUMMY_HASH = "$2b$10$kQL0nKtunLeCPUiBd4SH0eayhadO985qfRi0Bk4deY1OSFPikkUZe";

export async function login(form: FormData) {
  const tenant = await currentTenant();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const user = await tenantDb(tenant.id).user.findFirst({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return back("/connexion", { erreur: "E-mail ou mot de passe incorrect." });

  await createSession(user.id);
  return redirectTo("/espace");
}

export async function logout() {
  await destroySession();
  return redirectTo("/");
}

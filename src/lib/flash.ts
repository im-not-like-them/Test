import { redirect } from "next/navigation";

// Messages de retour transmis par l'URL après une action (pas de JS requis côté client).
export type FlashParams = Promise<{ ok?: string; erreur?: string }>;

// Asynchrone pour s'utiliser partout sous la forme `return back(...)`, ce qui
// garantit que TypeScript sait que l'exécution s'arrête là.
export async function redirectTo(path: string): Promise<never> {
  redirect(path);
}

export async function back(path: string, message: { ok: string } | { erreur: string }): Promise<never> {
  redirect(`${path}?${new URLSearchParams(message).toString()}`);
}

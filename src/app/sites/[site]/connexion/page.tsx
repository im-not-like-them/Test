import { Button, Card, Field, Flash, Input } from "@/components/ui";
import { TenantBrand } from "@/components/tenant-brand";
import { currentUser } from "@/lib/auth";
import { redirectTo, type FlashParams } from "@/lib/flash";
import { currentTenant } from "@/lib/tenant";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: FlashParams }) {
  const tenant = await currentTenant();
  if (await currentUser()) return redirectTo("/espace");
  const { ok, erreur } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <TenantBrand tenant={tenant} />
        </div>
        <Card>
          <h1 className="mb-4 text-lg font-semibold">Connexion à votre espace</h1>
          <Flash ok={ok} error={erreur} />
          <form action={login} className="space-y-4">
            <Field label="E-mail">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Mot de passe">
              <Input name="password" type="password" autoComplete="current-password" required />
            </Field>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

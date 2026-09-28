import Link from "next/link";
import { Card } from "@/components/ui";
import { rootDomain } from "@/lib/hosts";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Créer mon établissement — Kalanso" };

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="text-xl font-bold tracking-tight">
        Kalanso<span className="text-brand">.</span>
      </Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Créez la plateforme de votre établissement</h1>
      <p className="mt-2 text-stone-600">Gratuit pour démarrer. Vous pourrez tout personnaliser ensuite.</p>
      <Card className="mt-8">
        <SignupForm rootDomain={rootDomain()} />
      </Card>
    </main>
  );
}

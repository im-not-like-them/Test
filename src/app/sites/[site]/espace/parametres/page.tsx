import { Button, Card, Field, Flash, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import type { FlashParams } from "@/lib/flash";
import { rootDomain, tenantUrl } from "@/lib/hosts";
import { updateSettings } from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams: FlashParams }) {
  const { tenant } = await requireUser(["ADMIN"]);
  const { ok, erreur } = await searchParams;

  return (
    <>
      <PageHeader title="Personnalisation" description="L'apparence et les informations de votre site public." />
      <Flash ok={ok} error={erreur} />

      <form action={updateSettings} className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold">Identité</h2>
          <Field label="Nom de l'établissement"><Input name="name" required defaultValue={tenant.name} /></Field>
          <Field label="Slogan" hint="Affiché sous le nom sur la page d'accueil.">
            <Input name="tagline" defaultValue={tenant.tagline ?? ""} placeholder="L'excellence au service de la nation" />
          </Field>
          <Field label="Présentation">
            <Textarea name="about" rows={6} defaultValue={tenant.about ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville"><Input name="city" required defaultValue={tenant.city} /></Field>
            <Field label="Statut">
              <Select name="sector" defaultValue={tenant.sector}>
                <option value="PRIVE">Privé</option>
                <option value="PUBLIC">Public</option>
              </Select>
            </Field>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-semibold">Apparence</h2>
            <Field label="Logo (adresse de l'image)" hint="Lien https vers votre logo. L'envoi de fichier arrive bientôt.">
              <Input name="logoUrl" type="url" defaultValue={tenant.logoUrl ?? ""} placeholder="https://…/logo.png" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Couleur principale">
                <Input name="primaryColor" type="color" defaultValue={tenant.primaryColor} className="h-11 p-1" />
              </Field>
              <Field label="Couleur secondaire">
                <Input name="accentColor" type="color" defaultValue={tenant.accentColor} className="h-11 p-1" />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Contact</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="E-mail"><Input name="contactEmail" type="email" defaultValue={tenant.contactEmail ?? ""} /></Field>
              <Field label="Téléphone"><Input name="contactPhone" defaultValue={tenant.contactPhone ?? ""} placeholder="+225 07 00 00 00 00" /></Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Adresse web</h2>
            <p className="text-sm text-stone-600">
              Votre plateforme : <a className="font-medium text-brand" href={tenantUrl(tenant.slug)}>{tenant.slug}.{rootDomain()}</a>
            </p>
            <Field
              label="Domaine personnalisé (optionnel)"
              hint={`Chez votre registraire, créez un enregistrement CNAME de ce domaine vers ${tenant.slug}.${rootDomain().replace(/:\d+$/, "")}.`}
            >
              <Input name="customDomain" defaultValue={tenant.customDomain ?? ""} placeholder="portail.monuniversite.ci" />
            </Field>
          </Card>

          <Button type="submit" className="w-full py-3">Enregistrer</Button>
        </div>
      </form>
    </>
  );
}

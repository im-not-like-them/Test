import { EspaceNav, type NavItem } from "@/components/espace-nav";
import { TenantBrand } from "@/components/tenant-brand";
import { requireUser } from "@/lib/auth";
import { roleLabel, vocab } from "@/lib/vocab";
import { logout } from "../connexion/actions";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant } = await requireUser();
  const v = vocab(tenant.type);

  const items: NavItem[] = [
    { href: "/espace", label: "Tableau de bord" },
    { href: "/espace/classes", label: user.role === "ADMIN" ? v.classGroups : `Mes ${v.classGroups.toLowerCase()}` },
  ];
  if (user.role === "ADMIN") {
    items.push(
      { href: "/espace/structure", label: "Structure" },
      { href: "/espace/utilisateurs", label: "Utilisateurs" },
      { href: "/espace/parametres", label: "Personnalisation" },
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <TenantBrand tenant={tenant} href="/espace" />
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="hidden text-stone-600 hover:text-stone-900 sm:inline">
              Voir le site
            </a>
            <span className="hidden text-right sm:block">
              <span className="block font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="block text-xs text-stone-500">{roleLabel(user.role, tenant.type)}</span>
            </span>
            <form action={logout}>
              <button className="rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100">Déconnexion</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-52 md:shrink-0">
          <EspaceNav items={items} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

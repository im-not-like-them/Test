import { notFound } from "next/navigation";
import { ButtonLink, formatDate } from "@/components/ui";
import { TenantBrand } from "@/components/tenant-brand";
import { currentUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import { getTenantBySite } from "@/lib/tenant";
import { vocab } from "@/lib/vocab";

export default async function TenantHome({ params }: { params: Promise<{ site: string }> }) {
  const tenant = await getTenantBySite((await params).site);
  if (!tenant) notFound();
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);

  const [user, units, announcements, studentCount] = await Promise.all([
    currentUser(),
    db.unit.findMany({ orderBy: { name: "asc" }, include: { programs: { orderBy: { name: "asc" } } } }),
    db.announcement.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.user.count({ where: { role: "STUDENT" } }),
  ]);
  const programCount = units.reduce((n, u) => n + u.programs.length, 0);

  return (
    <main>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <TenantBrand tenant={tenant} />
          <nav className="flex items-center gap-4 text-sm">
            <a href="#formations" className="hidden text-stone-600 hover:text-stone-900 sm:inline">
              Formations
            </a>
            {announcements.length > 0 && (
              <a href="#actualites" className="hidden text-stone-600 hover:text-stone-900 sm:inline">
                Actualités
              </a>
            )}
            <ButtonLink href={user ? "/espace" : "/connexion"}>{user ? "Mon espace" : "Se connecter"}</ButtonLink>
          </nav>
        </div>
      </header>

      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">
            {v.establishment} {(tenant.sector === "PUBLIC" ? "public" : "privé") + (v.feminine ? "e" : "")} · {tenant.city}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{tenant.name}</h1>
          {tenant.tagline && <p className="mt-4 max-w-2xl text-lg opacity-90">{tenant.tagline}</p>}
          <dl className="mt-10 flex flex-wrap gap-8">
            <Stat label={v.units} value={units.length} />
            <Stat label={v.programs} value={programCount} />
            <Stat label={v.students} value={studentCount} />
          </dl>
        </div>
      </section>

      {tenant.about && (
        <section className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Présentation</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-stone-700">{tenant.about}</p>
        </section>
      )}

      <section id="formations" className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Nos formations</h2>
          {units.length === 0 ? (
            <p className="mt-4 text-stone-500">Les formations seront bientôt publiées.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {units.map((unit) => (
                <div key={unit.id} className="rounded-xl border border-stone-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {v.unit} · {unit.code}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{unit.name}</h3>
                  {unit.description && <p className="mt-2 text-sm text-stone-600">{unit.description}</p>}
                  <ul className="mt-4 space-y-2">
                    {unit.programs.map((p) => (
                      <li key={p.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span>{p.name}</span>
                        {p.degree && <span className="shrink-0 text-stone-500">{p.degree}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {announcements.length > 0 && (
        <section id="actualites" className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Actualités</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {announcements.map((a) => (
              <article key={a.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <time className="text-xs text-stone-500">{formatDate(a.createdAt)}</time>
                <h3 className="mt-1 font-semibold">{a.title}</h3>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-stone-600">{a.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-sm">
          <div>
            <p className="font-semibold text-white">{tenant.name}</p>
            <p>{tenant.city}, Côte d&apos;Ivoire</p>
          </div>
          <div className="text-right">
            {tenant.contactEmail && <p>{tenant.contactEmail}</p>}
            {tenant.contactPhone && <p>{tenant.contactPhone}</p>}
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-3xl font-bold">{value}</dd>
      <dt className="text-sm opacity-80">{label}</dt>
    </div>
  );
}

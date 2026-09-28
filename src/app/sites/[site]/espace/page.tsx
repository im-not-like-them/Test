import Link from "next/link";
import { AnnouncementForm, AnnouncementList } from "@/components/announcements";
import { ClassCard } from "@/components/class-card";
import { Card, Empty, Flash, PageHeader } from "@/components/ui";
import { visibleClassFilter } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import type { FlashParams } from "@/lib/flash";
import { vocab } from "@/lib/vocab";

export default async function Dashboard({ searchParams }: { searchParams: FlashParams }) {
  const { user, tenant } = await requireUser();
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);
  const { ok, erreur } = await searchParams;

  const classes = await db.classGroup.findMany({
    where: { ...visibleClassFilter(user), academicYear: { isCurrent: true } },
    include: { program: true, _count: { select: { enrollments: true, courses: true } } },
    orderBy: { name: "asc" },
  });

  // Annonces générales + annonces des classes de l'utilisateur.
  const announcements = await db.announcement.findMany({
    where: user.role === "ADMIN" ? {} : { OR: [{ classGroupId: null }, { classGroupId: { in: classes.map((c) => c.id) } }] },
    include: { author: true, classGroup: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <PageHeader title={`Bonjour ${user.firstName}`} description={tenant.name} />
      <Flash ok={ok} error={erreur} />

      {isAdmin && <AdminOverview tenantId={tenant.id} labels={v} />}

      {!isAdmin && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{user.role === "TEACHER" ? `Mes ${v.classGroups.toLowerCase()}` : `Ma ${v.classGroup.toLowerCase()}`}</h2>
          {classes.length === 0 ? (
            <Empty>Vous n&apos;êtes rattaché à aucune {v.classGroup.toLowerCase()} pour l&apos;année en cours.</Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <ClassCard key={c.id} c={c} studentsLabel={v.students} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Annonces</h2>
          <AnnouncementList items={announcements} viewer={user} redirectTo="/espace" />
        </div>
        {isAdmin && (
          <div>
            <AnnouncementForm redirectTo="/espace" allowPublic />
          </div>
        )}
      </section>
    </>
  );
}

async function AdminOverview({ tenantId, labels }: { tenantId: string; labels: ReturnType<typeof vocab> }) {
  const db = tenantDb(tenantId);
  const [units, programs, classes, students, teachers] = await Promise.all([
    db.unit.count(),
    db.program.count(),
    db.classGroup.count({ where: { academicYear: { isCurrent: true } } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "TEACHER" } }),
  ]);

  const steps = [
    { done: units > 0 && programs > 0 && classes > 0, label: `Créer vos ${labels.units}, ${labels.programs.toLowerCase()} et ${labels.classGroups.toLowerCase()}`, href: "/espace/structure" },
    { done: students > 0 || teachers > 0, label: "Importer vos enseignants et " + labels.students.toLowerCase(), href: "/espace/utilisateurs" },
    { done: false, label: "Personnaliser votre site (logo, couleurs, présentation)", href: "/espace/parametres" },
  ];
  const showSteps = !(steps[0]!.done && steps[1]!.done);

  return (
    <section className="mb-8 space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [labels.units, units],
          [labels.programs, programs],
          [labels.classGroups, classes],
          [labels.students, students],
          ["Enseignants", teachers],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-4">
            <dd className="text-2xl font-bold">{value}</dd>
            <dt className="text-sm text-stone-600">{label}</dt>
          </Card>
        ))}
      </dl>
      {showSteps && (
        <Card>
          <h2 className="mb-3 font-semibold">Mise en route</h2>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={s.href} className="flex items-center gap-3 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${s.done ? "bg-accent text-white" : "bg-stone-200"}`}>
                  {s.done ? "✓" : i + 1}
                </span>
                <Link href={s.href} className={s.done ? "text-stone-500 line-through" : "font-medium hover:text-brand"}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}

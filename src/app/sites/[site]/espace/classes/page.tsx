import { ClassCard } from "@/components/class-card";
import { Empty, PageHeader } from "@/components/ui";
import { visibleClassFilter } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import { vocab } from "@/lib/vocab";

export default async function ClassesPage() {
  const { user, tenant } = await requireUser();
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);

  const classes = await db.classGroup.findMany({
    where: { ...visibleClassFilter(user), academicYear: { isCurrent: true } },
    include: { program: { include: { unit: true } }, _count: { select: { enrollments: true, courses: true } } },
    orderBy: [{ program: { name: "asc" } }, { name: "asc" }],
  });

  // Regroupement par composante pour l'administration.
  const groups = new Map<string, typeof classes>();
  for (const c of classes) groups.set(c.program.unit.name, [...(groups.get(c.program.unit.name) ?? []), c]);

  return (
    <>
      <PageHeader title={user.role === "ADMIN" ? v.classGroups : `Mes ${v.classGroups.toLowerCase()}`} description="Année académique en cours." />
      {classes.length === 0 && <Empty>Aucune {v.classGroup.toLowerCase()} pour l&apos;instant.</Empty>}
      <div className="space-y-8">
        {[...groups].map(([unitName, list]) => (
          <section key={unitName}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">{unitName}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => <ClassCard key={c.id} c={c} studentsLabel={v.students} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Badge, Button, Card, Empty, Flash, Input, PageHeader, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import { roleLabel, vocab } from "@/lib/vocab";
import { deleteUser } from "./actions";
import { CreateUserForm, ImportUsersForm } from "./forms";

type Params = Promise<{ ok?: string; erreur?: string; role?: string; q?: string }>;
const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;

export default async function UsersPage({ searchParams }: { searchParams: Params }) {
  const { user: me, tenant } = await requireUser(["ADMIN"]);
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);
  const { ok, erreur, role, q } = await searchParams;

  const where: Prisma.UserWhereInput = {};
  if (role && (ROLES as readonly string[]).includes(role)) where.role = role as (typeof ROLES)[number];
  if (q) {
    where.OR = ["firstName", "lastName", "email", "matricule"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } }));
  }

  const [users, total, classes] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
      include: { enrollments: { where: { classGroup: { academicYear: { isCurrent: true } } }, include: { classGroup: true } } },
    }),
    db.user.count({ where }),
    db.classGroup.findMany({ where: { academicYear: { isCurrent: true } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const filterHref = (r?: string) => {
    const p = new URLSearchParams();
    if (r) p.set("role", r);
    if (q) p.set("q", q);
    return `/espace/utilisateurs${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Utilisateurs" description={`${v.students}, enseignants et administration.`} />
      <Flash ok={ok} error={erreur} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[undefined, ...ROLES].map((r) => (
              <Link
                key={r ?? "all"}
                href={filterHref(r)}
                className={cx("rounded-full px-3 py-1 text-sm", role === r || (!role && !r) ? "bg-brand text-white" : "bg-white text-stone-700 ring-1 ring-stone-200")}
              >
                {r ? roleLabel(r, tenant.type) : "Tous"}
              </Link>
            ))}
            <form className="ml-auto flex gap-2">
              {role && <input type="hidden" name="role" value={role} />}
              <Input name="q" defaultValue={q} placeholder="Nom, e-mail, matricule…" className="w-56" />
              <Button variant="secondary" type="submit">Chercher</Button>
            </form>
          </div>

          {users.length === 0 ? (
            <Empty>Aucun utilisateur.</Empty>
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">{v.classGroup}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.lastName.toUpperCase()} {u.firstName}</p>
                        <p className="text-xs text-stone-500">{u.email}{u.matricule && ` · ${u.matricule}`}</p>
                      </td>
                      <td className="px-4 py-3"><Badge>{roleLabel(u.role, tenant.type)}</Badge></td>
                      <td className="px-4 py-3 text-stone-600">{u.enrollments.map((e) => e.classGroup.name).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== me.id && (
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <Button variant="danger" className="px-2 py-1 text-xs">Supprimer</Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > users.length && <p className="border-t border-stone-100 px-4 py-3 text-xs text-stone-500">100 premiers résultats sur {total}. Affinez la recherche.</p>}
            </Card>
          )}
        </section>

        <aside className="space-y-4">
          <CreateUserForm classes={classes} studentLabel={v.student} />
          <ImportUsersForm />
        </aside>
      </div>
    </>
  );
}

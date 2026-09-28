import { notFound } from "next/navigation";
import { AnnouncementForm, AnnouncementList } from "@/components/announcements";
import { Badge, Button, Card, Empty, Field, Flash, Input, PageHeader, Select } from "@/components/ui";
import { canAccessClass } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import type { FlashParams } from "@/lib/flash";
import { vocab } from "@/lib/vocab";
import { addCourse, assignTeacher, enrollStudent, removeCourse, unenrollStudent } from "./actions";

type Props = { params: Promise<{ id: string }>; searchParams: FlashParams };

export default async function ClassPage({ params, searchParams }: Props) {
  const { user, tenant } = await requireUser();
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);
  const { id } = await params;
  const { ok, erreur } = await searchParams;

  if (!(await canAccessClass(db, user, id))) notFound();

  const classGroup = await db.classGroup.findFirst({
    where: { id },
    include: {
      program: { include: { unit: true } },
      academicYear: true,
      courses: { include: { teacher: true }, orderBy: [{ semester: "asc" }, { code: "asc" }] },
      enrollments: { include: { user: true }, orderBy: { user: { lastName: "asc" } } },
      announcements: { include: { author: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!classGroup) notFound();

  const isAdmin = user.role === "ADMIN";
  const canPost = isAdmin || user.role === "TEACHER";
  const teachers = isAdmin
    ? await db.user.findMany({ where: { role: "TEACHER" }, orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } })
    : [];
  const path = `/espace/classes/${classGroup.id}`;
  const hidden = <input type="hidden" name="classGroupId" value={classGroup.id} />;

  return (
    <>
      <PageHeader
        title={classGroup.name}
        description={`${classGroup.program.unit.name} · ${classGroup.program.name} · ${classGroup.academicYear.label}`}
        actions={<Badge className="text-sm">{classGroup.enrollments.length} {v.students.toLowerCase()}</Badge>}
      />
      <Flash ok={ok} error={erreur} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">{v.courses}</h2>
            {classGroup.courses.length === 0 ? (
              <Empty>Aucun cours pour l&apos;instant.</Empty>
            ) : (
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">{v.course}</th>
                      <th className="px-4 py-3">{v.weight}</th>
                      <th className="px-4 py-3">Enseignant</th>
                      {isAdmin && <th className="px-4 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {classGroup.courses.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-stone-500">{c.code}{c.semester && ` · Semestre ${c.semester}`}</p>
                        </td>
                        <td className="px-4 py-3">{c.weight ?? "—"}</td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <form action={assignTeacher} className="flex gap-1">
                              {hidden}
                              <input type="hidden" name="courseId" value={c.id} />
                              <Select name="teacherId" defaultValue={c.teacherId ?? ""} className="min-w-40 py-1 text-xs">
                                <option value="">Non attribué</option>
                                {teachers.map((t) => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                              </Select>
                              <Button variant="secondary" className="px-2 py-1 text-xs">OK</Button>
                            </form>
                          ) : c.teacher ? (
                            `${c.teacher.firstName} ${c.teacher.lastName}`
                          ) : (
                            <span className="text-stone-400">Non attribué</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <form action={removeCourse}>
                              {hidden}
                              <input type="hidden" name="courseId" value={c.id} />
                              <Button variant="danger" className="px-2 py-1 text-xs">Retirer</Button>
                            </form>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Annonces de la {v.classGroup.toLowerCase()}</h2>
            <AnnouncementList items={classGroup.announcements} viewer={user} redirectTo={path} />
          </section>

          {user.role !== "STUDENT" && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Liste des {v.students.toLowerCase()}</h2>
              {classGroup.enrollments.length === 0 ? (
                <Empty>Aucun inscrit.</Empty>
              ) : (
                <Card className="p-0">
                  <ul className="divide-y divide-stone-100 text-sm">
                    {classGroup.enrollments.map(({ user: s }) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2">
                        <span>
                          <span className="font-medium">{s.lastName.toUpperCase()} {s.firstName}</span>
                          <span className="ml-2 text-xs text-stone-500">{s.matricule ?? s.email}</span>
                        </span>
                        {isAdmin && (
                          <form action={unenrollStudent}>
                            {hidden}
                            <input type="hidden" name="userId" value={s.id} />
                            <Button variant="danger" className="px-2 py-1 text-xs">Retirer</Button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {canPost && <AnnouncementForm classGroupId={classGroup.id} redirectTo={path} />}
          {isAdmin && (
            <>
              <Card>
                <h2 className="mb-3 font-semibold">Ajouter : {v.course}</h2>
                <form action={addCourse} className="space-y-3">
                  {hidden}
                  <Field label="Intitulé"><Input name="title" required placeholder={tenant.type === "SECONDAIRE" ? "Mathématiques" : "Algorithmique 1"} /></Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Code"><Input name="code" required /></Field>
                    <Field label={v.weight}><Input name="weight" type="number" min={0} max={60} /></Field>
                    <Field label="Semestre"><Input name="semester" type="number" min={1} max={12} /></Field>
                  </div>
                  <Field label="Enseignant">
                    <Select name="teacherId" defaultValue="">
                      <option value="">Non attribué</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>)}
                    </Select>
                  </Field>
                  <Button type="submit" className="w-full">Ajouter</Button>
                </form>
              </Card>
              <Card>
                <h2 className="mb-3 font-semibold">Inscrire un {v.student.toLowerCase()}</h2>
                <form action={enrollStudent} className="space-y-3">
                  {hidden}
                  <Field label="E-mail ou matricule"><Input name="student" required /></Field>
                  <Button type="submit" variant="secondary" className="w-full">Inscrire</Button>
                </form>
              </Card>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

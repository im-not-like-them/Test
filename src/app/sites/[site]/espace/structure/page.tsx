import Link from "next/link";
import { Badge, Button, Card, Empty, Field, Flash, Input, PageHeader, Select } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { tenantDb } from "@/lib/db";
import type { FlashParams } from "@/lib/flash";
import { vocab } from "@/lib/vocab";
import { createClassGroup, createProgram, createUnit, deleteNode, setAcademicYear } from "./actions";

function DeleteButton({ kind, id }: { kind: "unit" | "program" | "class"; id: string }) {
  return (
    <form action={deleteNode}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button variant="danger" className="px-2 py-1 text-xs" title="Supprimer (seulement si vide)">
        Supprimer
      </Button>
    </form>
  );
}

export default async function StructurePage({ searchParams }: { searchParams: FlashParams }) {
  const { tenant } = await requireUser(["ADMIN"]);
  const db = tenantDb(tenant.id);
  const v = vocab(tenant.type);
  const { ok, erreur } = await searchParams;

  const [year, units] = await Promise.all([
    db.academicYear.findFirst({ where: { isCurrent: true } }),
    db.unit.findMany({
      orderBy: { name: "asc" },
      include: {
        programs: {
          orderBy: { name: "asc" },
          include: {
            classGroups: {
              where: { academicYear: { isCurrent: true } },
              orderBy: { name: "asc" },
              include: { _count: { select: { enrollments: true } } },
            },
          },
        },
      },
    }),
  ]);
  const programs = units.flatMap((u) => u.programs.map((p) => ({ ...p, unitName: u.name })));

  return (
    <>
      <PageHeader
        title="Structure académique"
        description={`${v.units} → ${v.programs} → ${v.classGroups}. Année en cours : ${year?.label ?? "non définie"}.`}
      />
      <Flash ok={ok} error={erreur} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="space-y-4">
          {units.length === 0 && <Empty>Commencez par ajouter une {v.unit.toLowerCase()} avec le formulaire.</Empty>}
          {units.map((unit) => (
            <Card key={unit.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge>{unit.code}</Badge>
                  <h2 className="mt-1 text-lg font-semibold">{unit.name}</h2>
                </div>
                <DeleteButton kind="unit" id={unit.id} />
              </div>
              {unit.programs.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">Aucune {v.program.toLowerCase()}.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {unit.programs.map((program) => (
                    <li key={program.id} className="rounded-lg bg-stone-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">
                          {program.name} <span className="text-sm font-normal text-stone-500">· {program.code}{program.degree && ` · ${program.degree}`}</span>
                        </p>
                        <DeleteButton kind="program" id={program.id} />
                      </div>
                      {program.classGroups.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {program.classGroups.map((c) => (
                            <li key={c.id} className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white py-1 pr-1 pl-3 text-sm">
                              <Link href={`/espace/classes/${c.id}`} className="hover:text-brand">
                                {c.name} <span className="text-stone-500">({c._count.enrollments})</span>
                              </Link>
                              <DeleteButton kind="class" id={c.id} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="mb-3 font-semibold">Ajouter : {v.unit}</h2>
            <form action={createUnit} className="space-y-3">
              <Field label="Nom">
                <Input name="name" required placeholder={tenant.type === "SECONDAIRE" ? "Second cycle" : "UFR Mathématiques et Informatique"} />
              </Field>
              <Field label="Code">
                <Input name="code" required placeholder={tenant.type === "SECONDAIRE" ? "C2" : "UFR-MI"} />
              </Field>
              <Button type="submit" className="w-full">Ajouter</Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Ajouter : {v.program}</h2>
            {units.length === 0 ? (
              <p className="text-sm text-stone-500">Créez d&apos;abord une {v.unit.toLowerCase()}.</p>
            ) : (
              <form action={createProgram} className="space-y-3">
                <Field label={v.unit}>
                  <Select name="unitId" required>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nom">
                  <Input name="name" required placeholder={tenant.type === "SECONDAIRE" ? "Série D" : "Informatique"} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Code">
                    <Input name="code" required placeholder={tenant.type === "SECONDAIRE" ? "D" : "INFO"} />
                  </Field>
                  <Field label="Diplôme">
                    <Input name="degree" placeholder={tenant.type === "SECONDAIRE" ? "BAC" : "Licence"} />
                  </Field>
                </div>
                <Button type="submit" className="w-full">Ajouter</Button>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Ajouter : {v.classGroup}</h2>
            {programs.length === 0 ? (
              <p className="text-sm text-stone-500">Créez d&apos;abord une {v.program.toLowerCase()}.</p>
            ) : (
              <form action={createClassGroup} className="space-y-3">
                <Field label={v.program}>
                  <Select name="programId" required>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unitName})</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nom">
                  <Input name="name" required placeholder={tenant.type === "SECONDAIRE" ? "Terminale D1" : "Licence 1 Informatique"} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Niveau">
                    <Input name="level" required placeholder={tenant.type === "SECONDAIRE" ? "Tle" : "L1"} />
                  </Field>
                  <Field label="Code">
                    <Input name="code" required placeholder={tenant.type === "SECONDAIRE" ? "TD1" : "L1-INFO"} />
                  </Field>
                </div>
                <Button type="submit" className="w-full">Ajouter</Button>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Année académique en cours</h2>
            <form action={setAcademicYear} className="flex gap-2">
              <Input name="label" required defaultValue={year?.label} placeholder="2025-2026" />
              <Button type="submit" variant="secondary">Définir</Button>
            </form>
            <p className="mt-2 text-xs text-stone-500">Changer d&apos;année affiche les classes de la nouvelle année ; les anciennes restent archivées.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

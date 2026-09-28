// Test d'intégration : nécessite la base PostgreSQL (DATABASE_URL).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma, tenantDb } from "@/lib/db";

const SLUGS = ["test-iso-a", "test-iso-b"];
let a: { id: string; unitId: string };
let b: { id: string; unitId: string };

async function makeTenant(slug: string) {
  const t = await prisma.tenant.create({ data: { slug, name: slug, type: "UNIVERSITE" } });
  const unit = await prisma.unit.create({ data: { tenantId: t.id, code: "U1", name: `Unité ${slug}` } });
  return { id: t.id, unitId: unit.id };
}

beforeAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { in: SLUGS } } });
  a = await makeTenant(SLUGS[0]!);
  b = await makeTenant(SLUGS[1]!);
});

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { in: SLUGS } } });
  await prisma.$disconnect();
});

describe("tenantDb", () => {
  it("ne lit que les données de son établissement", async () => {
    const units = await tenantDb(a.id).unit.findMany();
    expect(units.map((u) => u.id)).toEqual([a.unitId]);
  });

  it("ne trouve pas un enregistrement d'un autre établissement, même par son id", async () => {
    expect(await tenantDb(a.id).unit.findUnique({ where: { id: b.unitId } })).toBeNull();
    expect(await tenantDb(a.id).unit.findFirst({ where: { id: b.unitId } })).toBeNull();
    expect(await tenantDb(a.id).unit.count({ where: { id: b.unitId } })).toBe(0);
  });

  it("ne modifie ni ne supprime les données d'un autre établissement", async () => {
    const updated = await tenantDb(a.id).unit.updateMany({ where: { id: b.unitId }, data: { name: "piraté" } });
    const deleted = await tenantDb(a.id).unit.deleteMany({ where: { id: b.unitId } });
    expect(updated.count).toBe(0);
    expect(deleted.count).toBe(0);
    await expect(tenantDb(a.id).unit.update({ where: { id: b.unitId }, data: { name: "piraté" } })).rejects.toThrow();
    expect((await prisma.unit.findUnique({ where: { id: b.unitId } }))?.name).toBe(`Unité ${SLUGS[1]}`);
  });

  it("force le tenantId à la création, même si un autre est fourni", async () => {
    const unit = await tenantDb(a.id).unit.create({ data: { tenantId: b.id, code: "U2", name: "Nouvelle" } });
    expect(unit.tenantId).toBe(a.id);
  });

  it("la base refuse une filière rattachée à l'UFR d'un autre établissement", async () => {
    await expect(
      prisma.program.create({ data: { tenantId: a.id, unitId: b.unitId, code: "X", name: "Croisée" } }),
    ).rejects.toThrow();
  });
});

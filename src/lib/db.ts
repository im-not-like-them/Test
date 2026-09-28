import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Client brut : réservé aux opérations « plateforme » (création d'établissement,
// résolution du domaine, sessions). Le code métier passe par `tenantDb`.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const SCOPED_MODELS = new Set<string>([
  "User",
  "AcademicYear",
  "Unit",
  "Program",
  "ClassGroup",
  "Course",
  "Enrollment",
  "Announcement",
]);

const WHERE_OPERATIONS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
]);

const CREATE_MANY_OPERATIONS = new Set<string>(["createMany", "createManyAndReturn"]);

/**
 * Client Prisma cloisonné à un établissement : chaque lecture est filtrée par
 * `tenantId` et chaque écriture le renseigne. Les créations doivent utiliser les
 * identifiants scalaires (unitId, programId…) plutôt que `connect`.
 */
export function tenantDb(tenantId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED_MODELS.has(model)) return query(args);
          const a = (args ?? {}) as Record<string, unknown>;

          if (WHERE_OPERATIONS.has(operation)) {
            a.where = { ...(a.where as object), tenantId };
          } else if (operation === "create") {
            a.data = { ...(a.data as object), tenantId };
          } else if (CREATE_MANY_OPERATIONS.has(operation)) {
            const rows = Array.isArray(a.data) ? a.data : [a.data];
            a.data = rows.map((row) => ({ ...(row as object), tenantId }));
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object), tenantId };
            a.create = { ...(a.create as object), tenantId };
          }
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

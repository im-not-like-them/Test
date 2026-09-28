import "server-only";
import type { User } from "@prisma/client";
import type { TenantDb } from "@/lib/db";

// Classes visibles par un utilisateur : toutes pour l'administration, celles où
// il enseigne pour un enseignant, celles où il est inscrit pour un étudiant.
export function visibleClassFilter(user: User) {
  if (user.role === "ADMIN") return {};
  if (user.role === "TEACHER") return { courses: { some: { teacherId: user.id } } };
  return { enrollments: { some: { userId: user.id } } };
}

export async function canAccessClass(db: TenantDb, user: User, classGroupId: string): Promise<boolean> {
  const count = await db.classGroup.count({ where: { id: classGroupId, ...visibleClassFilter(user) } });
  return count > 0;
}

export async function canPostInClass(db: TenantDb, user: User, classGroupId: string): Promise<boolean> {
  if (user.role === "STUDENT") return false;
  return canAccessClass(db, user, classGroupId);
}

import type { Role, TenantType } from "@prisma/client";

// Chaque type d'établissement a son vocabulaire : on parle d'UFR et d'UE à
// l'université, de cycles et de matières au lycée.
export type Vocab = {
  establishment: string;
  // Pour accorder « public/publique », « privé/privée ».
  feminine: boolean;
  unit: string;
  units: string;
  program: string;
  programs: string;
  classGroup: string;
  classGroups: string;
  course: string;
  courses: string;
  weight: string;
  student: string;
  students: string;
};

const VOCAB: Record<TenantType, Vocab> = {
  UNIVERSITE: {
    establishment: "Université",
    feminine: true,
    unit: "UFR",
    units: "UFR",
    program: "Filière",
    programs: "Filières",
    classGroup: "Promotion",
    classGroups: "Promotions",
    course: "UE",
    courses: "UE",
    weight: "Crédits",
    student: "Étudiant",
    students: "Étudiants",
  },
  GRANDE_ECOLE: {
    establishment: "Grande école",
    feminine: true,
    unit: "École",
    units: "Écoles",
    program: "Filière",
    programs: "Filières",
    classGroup: "Classe",
    classGroups: "Classes",
    course: "Module",
    courses: "Modules",
    weight: "Crédits",
    student: "Étudiant",
    students: "Étudiants",
  },
  SECONDAIRE: {
    establishment: "Établissement secondaire",
    feminine: false,
    unit: "Cycle",
    units: "Cycles",
    program: "Série",
    programs: "Séries",
    classGroup: "Classe",
    classGroups: "Classes",
    course: "Matière",
    courses: "Matières",
    weight: "Coefficient",
    student: "Élève",
    students: "Élèves",
  },
};

export function vocab(type: TenantType): Vocab {
  return VOCAB[type];
}

export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  UNIVERSITE: "Université",
  GRANDE_ECOLE: "Grande école / Institut",
  SECONDAIRE: "Lycée / Collège",
};

export function roleLabel(role: Role, type: TenantType): string {
  if (role === "ADMIN") return "Administration";
  if (role === "TEACHER") return "Enseignant";
  return vocab(type).student;
}

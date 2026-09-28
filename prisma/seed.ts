// Données de démonstration : deux établissements fictifs sur la même plateforme.
//   http://ul.localhost:3000        Université des Lagunes (université publique)
//   http://palmiers.localhost:3000  Lycée Moderne Les Palmiers (lycée privé)
// Mot de passe de tous les comptes de démo : demo1234

import bcrypt from "bcryptjs";
import { PrismaClient, type Role, type TenantType } from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD = "demo1234";

type ClassSeed = { code: string; name: string; level: string; courses: [code: string, title: string, weight: number, semester?: number][] };
type ProgramSeed = { code: string; name: string; degree: string; classes: ClassSeed[] };
type UnitSeed = { code: string; name: string; description?: string; programs: ProgramSeed[] };
type PersonSeed = [firstName: string, lastName: string, role: Role, classCode?: string];

type TenantSeed = {
  slug: string;
  name: string;
  type: TenantType;
  sector: "PUBLIC" | "PRIVE";
  city: string;
  tagline: string;
  about: string;
  primaryColor: string;
  accentColor: string;
  emailDomain: string;
  units: UnitSeed[];
  people: PersonSeed[];
  announcements: { title: string; body: string; isPublic?: boolean; classCode?: string }[];
};

const TENANTS: TenantSeed[] = [
  {
    slug: "ul",
    name: "Université des Lagunes",
    type: "UNIVERSITE",
    sector: "PUBLIC",
    city: "Abidjan",
    tagline: "Former les talents qui construiront la Côte d'Ivoire de demain.",
    about:
      "L'Université des Lagunes accueille ses étudiants dans le système LMD (Licence, Master, Doctorat).\n\nNos UFR proposent des formations en sciences, en informatique et en économie, en lien avec les entreprises de la place.",
    primaryColor: "#E66A00",
    accentColor: "#007A4D",
    emailDomain: "ul.demo",
    units: [
      {
        code: "UFR-MI",
        name: "UFR Mathématiques et Informatique",
        description: "Informatique, mathématiques appliquées et statistiques.",
        programs: [
          {
            code: "INFO",
            name: "Informatique",
            degree: "Licence",
            classes: [
              {
                code: "L1-INFO",
                name: "Licence 1 Informatique",
                level: "L1",
                courses: [
                  ["INF101", "Algorithmique et programmation 1", 6, 1],
                  ["INF102", "Architecture des ordinateurs", 4, 1],
                  ["MAT101", "Analyse 1", 5, 1],
                  ["ANG101", "Anglais scientifique", 2, 1],
                ],
              },
              {
                code: "L2-INFO",
                name: "Licence 2 Informatique",
                level: "L2",
                courses: [
                  ["INF201", "Bases de données", 6, 3],
                  ["INF202", "Programmation web", 5, 3],
                  ["INF203", "Réseaux informatiques", 5, 3],
                ],
              },
            ],
          },
          {
            code: "MATH",
            name: "Mathématiques",
            degree: "Licence",
            classes: [
              {
                code: "L1-MATH",
                name: "Licence 1 Mathématiques",
                level: "L1",
                courses: [
                  ["MAT101", "Analyse 1", 6, 1],
                  ["MAT102", "Algèbre linéaire 1", 6, 1],
                ],
              },
            ],
          },
        ],
      },
      {
        code: "UFR-SEG",
        name: "UFR Sciences Économiques et Gestion",
        programs: [
          {
            code: "ECO",
            name: "Économie",
            degree: "Licence",
            classes: [
              {
                code: "L1-ECO",
                name: "Licence 1 Économie",
                level: "L1",
                courses: [
                  ["ECO101", "Microéconomie", 6, 1],
                  ["ECO102", "Comptabilité générale", 5, 1],
                ],
              },
            ],
          },
          {
            code: "MFIN",
            name: "Finance d'entreprise",
            degree: "Master",
            classes: [
              {
                code: "M1-FIN",
                name: "Master 1 Finance",
                level: "M1",
                courses: [
                  ["FIN701", "Finance de marché", 6, 1],
                  ["FIN702", "Microfinance et inclusion financière", 4, 1],
                ],
              },
            ],
          },
        ],
      },
    ],
    people: [
      ["Aya", "Kouassi", "ADMIN"],
      ["Konan", "Yao", "TEACHER"],
      ["Mariam", "Traoré", "TEACHER"],
      ["Serge", "Gnagne", "TEACHER"],
      ["Ange", "Koffi", "STUDENT", "L1-INFO"],
      ["Fatou", "Diabaté", "STUDENT", "L1-INFO"],
      ["Yannick", "Bamba", "STUDENT", "L1-INFO"],
      ["Grâce", "N'Guessan", "STUDENT", "L1-INFO"],
      ["Ibrahim", "Ouattara", "STUDENT", "L2-INFO"],
      ["Christelle", "Aka", "STUDENT", "L2-INFO"],
      ["Moussa", "Coulibaly", "STUDENT", "L1-MATH"],
      ["Estelle", "Kacou", "STUDENT", "L1-ECO"],
      ["Daniel", "Zadi", "STUDENT", "L1-ECO"],
      ["Awa", "Soro", "STUDENT", "M1-FIN"],
    ],
    announcements: [
      {
        title: "Ouverture des inscriptions pédagogiques",
        body: "Les inscriptions pédagogiques pour le premier semestre sont ouvertes jusqu'au 31 octobre. Rendez-vous dans votre UFR avec votre quittance de paiement.",
        isPublic: true,
      },
      {
        title: "Journée portes ouvertes",
        body: "L'université ouvre ses portes aux bacheliers et à leurs parents le samedi 15 novembre, de 9h à 16h.",
        isPublic: true,
      },
      {
        title: "Premier TP d'algorithmique",
        body: "Le premier TP aura lieu lundi en salle informatique 2. Apportez une clé USB.",
        classCode: "L1-INFO",
      },
    ],
  },
  {
    slug: "palmiers",
    name: "Lycée Moderne Les Palmiers",
    type: "SECONDAIRE",
    sector: "PRIVE",
    city: "Yamoussoukro",
    tagline: "Discipline, travail, réussite.",
    about: "Établissement privé laïc accueillant les élèves de la 6e à la Terminale. Séries A, C et D au second cycle.",
    primaryColor: "#1D4ED8",
    accentColor: "#CA8A04",
    emailDomain: "palmiers.demo",
    units: [
      {
        code: "C1",
        name: "Premier cycle",
        programs: [
          {
            code: "1C",
            name: "Premier cycle",
            degree: "BEPC",
            classes: [
              {
                code: "3A",
                name: "3e A",
                level: "3e",
                courses: [
                  ["FR", "Français", 4],
                  ["MATH", "Mathématiques", 4],
                  ["SVT", "SVT", 2],
                  ["HG", "Histoire-Géographie", 2],
                ],
              },
            ],
          },
        ],
      },
      {
        code: "C2",
        name: "Second cycle",
        programs: [
          { code: "A", name: "Série A", degree: "BAC", classes: [{ code: "TA2", name: "Terminale A2", level: "Tle", courses: [["PHILO", "Philosophie", 5], ["FR", "Français", 4], ["ANG", "Anglais", 3]] }] },
          { code: "C", name: "Série C", degree: "BAC", classes: [{ code: "2C", name: "Seconde C", level: "2nde", courses: [["MATH", "Mathématiques", 5], ["PC", "Physique-Chimie", 4]] }] },
          {
            code: "D",
            name: "Série D",
            degree: "BAC",
            classes: [
              { code: "TD1", name: "Terminale D1", level: "Tle", courses: [["MATH", "Mathématiques", 4], ["PC", "Physique-Chimie", 4], ["SVT", "SVT", 4], ["PHILO", "Philosophie", 2]] },
            ],
          },
        ],
      },
    ],
    people: [
      ["Paul", "Kra", "ADMIN"],
      ["Brigitte", "Yapi", "TEACHER"],
      ["Lassina", "Konaté", "TEACHER"],
      ["Emmanuel", "Tanoh", "STUDENT", "TD1"],
      ["Nadège", "Ehui", "STUDENT", "TD1"],
      ["Karim", "Sangaré", "STUDENT", "TD1"],
      ["Bintou", "Fofana", "STUDENT", "TA2"],
      ["Jean-Marc", "Assi", "STUDENT", "2C"],
      ["Prisca", "Dago", "STUDENT", "3A"],
    ],
    announcements: [
      { title: "Rentrée des classes", body: "La rentrée des classes est fixée au lundi 15 septembre à 7h30. Tenue réglementaire exigée.", isPublic: true },
      { title: "Devoir surveillé de mathématiques", body: "DS de mathématiques samedi à 8h. Durée : 3 heures. Calculatrice autorisée.", classCode: "TD1" },
    ],
  },
];

function slugEmail(first: string, last: string, domain: string): string {
  const clean = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  return `${clean(first)}.${clean(last)}@${domain}`;
}

function currentYearLabel(now = new Date()): string {
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

async function seedTenant(t: TenantSeed, passwordHash: string) {
  await prisma.tenant.deleteMany({ where: { slug: t.slug } });
  const tenant = await prisma.tenant.create({
    data: {
      slug: t.slug,
      name: t.name,
      type: t.type,
      sector: t.sector,
      city: t.city,
      tagline: t.tagline,
      about: t.about,
      primaryColor: t.primaryColor,
      accentColor: t.accentColor,
      contactEmail: `contact@${t.emailDomain}`,
      contactPhone: "+225 27 20 00 00 00",
    },
  });
  const tenantId = tenant.id;
  const year = await prisma.academicYear.create({ data: { tenantId, label: currentYearLabel(), isCurrent: true } });

  const users = new Map<string, { id: string; role: Role; classCode?: string }>();
  let matricule = 1;
  for (const [firstName, lastName, role, classCode] of t.people) {
    const email = slugEmail(firstName, lastName, t.emailDomain);
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        firstName,
        lastName,
        role,
        passwordHash,
        matricule: role === "STUDENT" ? `${t.slug.toUpperCase()}-${String(matricule++).padStart(5, "0")}` : null,
      },
    });
    users.set(email, { id: user.id, role, classCode });
  }
  const teachers = [...users.values()].filter((u) => u.role === "TEACHER");
  const admin = [...users.values()].find((u) => u.role === "ADMIN")!;

  const classIds = new Map<string, string>();
  let courseIndex = 0;
  for (const u of t.units) {
    const unit = await prisma.unit.create({ data: { tenantId, code: u.code, name: u.name, description: u.description } });
    for (const p of u.programs) {
      const program = await prisma.program.create({ data: { tenantId, unitId: unit.id, code: p.code, name: p.name, degree: p.degree } });
      for (const c of p.classes) {
        const cg = await prisma.classGroup.create({
          data: { tenantId, programId: program.id, academicYearId: year.id, code: c.code, name: c.name, level: c.level },
        });
        classIds.set(c.code, cg.id);
        for (const [code, title, weight, semester] of c.courses) {
          const teacher = teachers[courseIndex++ % teachers.length];
          await prisma.course.create({
            data: { tenantId, classGroupId: cg.id, code, title, weight, semester, teacherId: teacher?.id },
          });
        }
      }
    }
  }

  for (const u of users.values()) {
    if (u.role === "STUDENT" && u.classCode) {
      await prisma.enrollment.create({ data: { tenantId, userId: u.id, classGroupId: classIds.get(u.classCode)! } });
    }
  }

  for (const a of t.announcements) {
    await prisma.announcement.create({
      data: {
        tenantId,
        authorId: admin.id,
        title: a.title,
        body: a.body,
        isPublic: a.isPublic ?? false,
        classGroupId: a.classCode ? classIds.get(a.classCode) : null,
      },
    });
  }

  const adminEmail = [...users.entries()].find(([, u]) => u.role === "ADMIN")![0];
  console.log(`✔ ${t.name} — http://${t.slug}.localhost:3000 — admin : ${adminEmail}`);
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  for (const t of TENANTS) await seedTenant(t, passwordHash);
  console.log(`Mot de passe de tous les comptes : ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { z } from "zod";

// Import en masse des utilisateurs. Format attendu (séparateur , ou ;) :
// prenom;nom;email;role;matricule;classe
// role : etudiant | eleve | enseignant | admin — classe : code de la classe (optionnel)

export type ImportRow = {
  line: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  matricule: string | null;
  classCode: string | null;
};

export type ImportError = { line: number; message: string };

const ROLE_ALIASES: Record<string, ImportRow["role"]> = {
  etudiant: "STUDENT",
  étudiant: "STUDENT",
  eleve: "STUDENT",
  élève: "STUDENT",
  student: "STUDENT",
  enseignant: "TEACHER",
  professeur: "TEACHER",
  prof: "TEACHER",
  teacher: "TEACHER",
  admin: "ADMIN",
  administration: "ADMIN",
};

const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, "line">> = {
  prenom: "firstName",
  prénom: "firstName",
  prenoms: "firstName",
  prénoms: "firstName",
  nom: "lastName",
  email: "email",
  "e-mail": "email",
  mail: "email",
  role: "role",
  rôle: "role",
  matricule: "matricule",
  classe: "classCode",
};

const emailSchema = z.string().email();

function splitLine(line: string, sep: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

export function parseUsersCsv(text: string): { rows: ImportRow[]; errors: ImportError[] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const headerIndex = lines.findIndex((l) => l.trim() !== "");
  if (headerIndex === -1) return { rows: [], errors: [{ line: 1, message: "Fichier vide." }] };

  const headerLine = lines[headerIndex]!;
  // Excel en français exporte souvent avec des points-virgules.
  const sep = headerLine.split(";").length >= headerLine.split(",").length ? ";" : ",";
  const columns = splitLine(headerLine, sep).map((h) => HEADER_ALIASES[h.toLowerCase()]);

  for (const required of ["firstName", "lastName", "email", "role"] as const) {
    if (!columns.includes(required)) {
      return {
        rows: [],
        errors: [{ line: headerIndex + 1, message: "En-tête attendu : prenom;nom;email;role;matricule;classe" }],
      };
    }
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();

  lines.slice(headerIndex + 1).forEach((raw, i) => {
    const line = headerIndex + i + 2;
    if (raw.trim() === "") return;
    const cells = splitLine(raw, sep);
    const get = (key: keyof Omit<ImportRow, "line">) => {
      const idx = columns.indexOf(key);
      return idx === -1 ? "" : (cells[idx] ?? "");
    };

    const email = get("email").toLowerCase();
    const role = ROLE_ALIASES[get("role").toLowerCase()];
    if (!get("firstName") || !get("lastName")) return errors.push({ line, message: "Prénom et nom obligatoires." });
    if (!emailSchema.safeParse(email).success) return errors.push({ line, message: `E-mail invalide : « ${email} ».` });
    if (!role) return errors.push({ line, message: `Rôle inconnu : « ${get("role")} ».` });
    if (seen.has(email)) return errors.push({ line, message: `E-mail en double dans le fichier : ${email}.` });
    seen.add(email);

    rows.push({
      line,
      firstName: get("firstName"),
      lastName: get("lastName"),
      email,
      role,
      matricule: get("matricule") || null,
      classCode: get("classCode") || null,
    });
  });

  return { rows, errors };
}

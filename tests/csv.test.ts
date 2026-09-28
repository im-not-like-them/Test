import { describe, expect, it } from "vitest";
import { parseUsersCsv } from "@/lib/csv";

describe("parseUsersCsv", () => {
  it("lit un export Excel français (point-virgule, BOM, accents)", () => {
    const csv = "﻿Prénom;Nom;Email;Rôle;Matricule;Classe\r\nAnge;Koffi;Ange.Koffi@ul.demo;étudiant;UL-001;L1-INFO\r\nKonan;Yao;konan@ul.demo;enseignant;;\r\n";
    const { rows, errors } = parseUsersCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { line: 2, firstName: "Ange", lastName: "Koffi", email: "ange.koffi@ul.demo", role: "STUDENT", matricule: "UL-001", classCode: "L1-INFO" },
      { line: 3, firstName: "Konan", lastName: "Yao", email: "konan@ul.demo", role: "TEACHER", matricule: null, classCode: null },
    ]);
  });

  it("accepte les virgules et les champs entre guillemets", () => {
    const { rows } = parseUsersCsv('prenom,nom,email,role\n"Grâce","N\'Guessan, épouse Aka",grace@ul.demo,eleve');
    expect(rows[0]).toMatchObject({ lastName: "N'Guessan, épouse Aka", role: "STUDENT" });
  });

  it("signale les lignes invalides sans bloquer les autres", () => {
    const csv = ["prenom;nom;email;role", "A;B;pas-un-email;etudiant", "C;D;c@x.ci;directeur", "E;F;e@x.ci;admin", "G;H;e@x.ci;admin"].join("\n");
    const { rows, errors } = parseUsersCsv(csv);
    expect(rows.map((r) => r.email)).toEqual(["e@x.ci"]);
    expect(errors.map((e) => e.line)).toEqual([2, 3, 5]);
  });

  it("exige les colonnes obligatoires", () => {
    const { rows, errors } = parseUsersCsv("nom;email\nKoffi;a@b.ci");
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
  });
});

import Link from "next/link";
import { ButtonLink } from "@/components/ui";

const FEATURES = [
  {
    title: "Un site à vos couleurs",
    text: "Chaque établissement a son adresse (monecole.kalanso.ci ou votre propre domaine), son logo, ses couleurs et sa présentation.",
  },
  {
    title: "Toutes vos classes en ligne",
    text: "UFR, filières, promotions, séries, classes : chaque classe a son espace avec ses cours, ses enseignants et ses annonces.",
  },
  {
    title: "Import en un clic",
    text: "Importez vos étudiants, élèves et enseignants depuis un fichier Excel/CSV. Pas besoin de tout ressaisir.",
  },
  {
    title: "Pensé pour la Côte d'Ivoire",
    text: "Système LMD, BTS, séries du secondaire, pages légères qui chargent vite même avec une connexion mobile.",
  },
];

export default function PlatformHome() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Kalanso<span className="text-brand">.</span>
        </Link>
        <ButtonLink href="/inscription">Créer mon établissement</ButtonLink>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:pt-20">
        <p className="mb-4 inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          Universités · Grandes écoles · Lycées et collèges
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          La plateforme en ligne de votre établissement, prête en 5 minutes.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Site public, espace pour chaque classe, cours, enseignants et annonces. Chaque établissement personnalise sa
          plateforme comme il le souhaite.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/inscription" className="px-6 py-3 text-base">
            Commencer gratuitement
          </ButtonLink>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-stone-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-500">© {new Date().getFullYear()} Kalanso — Abidjan</footer>
    </main>
  );
}

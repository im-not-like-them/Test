import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalanso — la plateforme des établissements scolaires",
  description: "Site, classes, cours et annonces pour les universités, grandes écoles et lycées de Côte d'Ivoire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

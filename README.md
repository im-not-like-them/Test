# Kalanso

Plateforme SaaS multi-établissements pour les **universités, grandes écoles, lycées et collèges de Côte d'Ivoire**.

Chaque établissement crée sa plateforme en quelques minutes et la personnalise comme il veut, à la manière de Shopify pour les boutiques :

- **son adresse** : `monecole.kalanso.ci`, ou son propre domaine (`portail.monuniversite.ci`) ;
- **son site public** à ses couleurs : logo, slogan, présentation, formations, actualités ;
- **sa structure académique** : UFR → filières → promotions → UE pour une université, cycles → séries → classes → matières pour un lycée ;
- **ses utilisateurs** : administration, enseignants, étudiants/élèves, avec import en masse depuis Excel (CSV) ;
- **un espace par classe** : cours, enseignants, liste des inscrits, annonces.

> « Kalanso » (du dioula *kalan*, étudier, et *so*, maison) est un nom de travail.

## Démarrage rapide

Prérequis : Node.js 20+ et PostgreSQL 16 (ou Docker).

```bash
npm install
cp .env.example .env
docker compose up -d          # ou utilisez votre propre PostgreSQL (voir DATABASE_URL)
npm run db:deploy             # crée les tables
npm run db:seed               # deux établissements de démonstration
npm run dev
```

Puis ouvrez (les sous-domaines de `localhost` fonctionnent directement dans Chrome, Firefox et Edge) :

| Adresse | Contenu |
|---|---|
| http://localhost:3000 | Site de la plateforme + inscription d'un nouvel établissement |
| http://ul.localhost:3000 | **Université des Lagunes** (université publique, Abidjan) |
| http://palmiers.localhost:3000 | **Lycée Moderne Les Palmiers** (lycée privé, Yamoussoukro) |

Comptes de démonstration (mot de passe : `demo1234`) :

| Établissement | Administration | Enseignant | Étudiant / élève |
|---|---|---|---|
| Université des Lagunes | `aya.kouassi@ul.demo` | `konan.yao@ul.demo` | `ange.koffi@ul.demo` |
| Lycée Les Palmiers | `paul.kra@palmiers.demo` | `brigitte.yapi@palmiers.demo` | `emmanuel.tanoh@palmiers.demo` |

## Architecture

**Stack** : Next.js 15 (App Router, server actions) · TypeScript · PostgreSQL + Prisma · Tailwind CSS 4.

### Multi-tenant

1. **Routage par domaine** (`src/middleware.ts`) : `ul.kalanso.ci/espace` est réécrit en interne vers `/sites/ul/espace`, sans que l'URL change dans le navigateur. Tout autre domaine est cherché dans `Tenant.customDomain`.
2. **Une base partagée, cloisonnée par `tenantId`** : chaque table métier porte un `tenantId`.
   - `tenantDb(tenantId)` (`src/lib/db.ts`) ajoute automatiquement le filtre `tenantId` à toutes les lectures, mises à jour et suppressions, et l'impose à la création. Le code métier n'utilise que ce client.
   - Les relations passent par des **clés étrangères composites `(tenantId, id)`** : la base refuse, par exemple, une filière rattachée à l'UFR d'un autre établissement.
3. **Sessions par établissement** : le cookie est propre au sous-domaine, et une session n'est acceptée que sur l'établissement de son utilisateur.

Les tests `tests/tenant-isolation.test.ts` vérifient qu'un établissement ne peut ni lire, ni modifier, ni supprimer les données d'un autre.

### Vocabulaire adapté

Le type d'établissement (`UNIVERSITE`, `GRANDE_ECOLE`, `SECONDAIRE`) adapte les libellés dans toute l'interface (`src/lib/vocab.ts`) : UFR / École / Cycle, Filière / Série, Promotion / Classe, UE / Module / Matière, Crédits / Coefficient, Étudiant / Élève.

### Arborescence

```
prisma/
  schema.prisma          modèle de données
  seed.ts                établissements de démonstration
src/
  middleware.ts          résolution de l'établissement par le domaine
  lib/                   db (cloisonnement), auth, hosts, vocab, import CSV…
  app/
    page.tsx             site de la plateforme
    inscription/         création d'un établissement
    sites/[site]/        tout ce qui est propre à un établissement
      page.tsx           site public
      connexion/
      espace/            espace connecté (tableau de bord, classes, structure,
                         utilisateurs, personnalisation)
tests/                   tests unitaires et d'isolation (Vitest)
```

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm test` | tests (nécessite la base pour le test d'isolation) |
| `npm run typecheck` | vérification TypeScript |
| `npm run db:migrate` | nouvelle migration après modification du schéma |
| `npm run db:seed` | (re)charger les données de démonstration |

## Import des utilisateurs (CSV)

Depuis Excel : *Enregistrer sous → CSV (séparateur : point-virgule)*.

```
prenom;nom;email;role;matricule;classe
Ange;Koffi;ange.koffi@exemple.ci;etudiant;UL-00001;L1-INFO
Konan;Yao;konan.yao@exemple.ci;enseignant;;
```

- `role` : `etudiant`, `eleve`, `enseignant` ou `admin`.
- `classe` : le **code** d'une classe de l'année en cours (facultatif).

Un mot de passe est généré pour chaque compte, affiché une seule fois et téléchargeable en CSV pour être distribué.

## Mise en production

- `ROOT_DOMAIN=kalanso.ci` et `PROTOCOL=https`.
- DNS : un enregistrement wildcard `*.kalanso.ci` vers le serveur, avec un certificat wildcard.
- Domaines personnalisés : l'établissement crée un CNAME vers `<slug>.kalanso.ci`. Il faut un certificat par domaine : Vercel, Caddy (TLS à la demande) ou Cloudflare for SaaS le gèrent automatiquement.
- Derrière un reverse proxy, transmettez `X-Forwarded-Host` : c'est l'en-tête lu en priorité pour identifier l'établissement.

## Feuille de route

- [ ] Notes, moyennes et bulletins (LMD : crédits capitalisés ; secondaire : moyennes par coefficient)
- [ ] Emploi du temps et salles
- [ ] Absences et suivi des retards
- [ ] Paiement des frais de scolarité par mobile money (Orange Money, MTN MoMo, Moov Money, Wave)
- [ ] Notifications SMS / WhatsApp (annonces, résultats, paiements)
- [ ] Espace parents (secondaire)
- [ ] Envoi de fichiers (logo, supports de cours) et invitations par e-mail/SMS
- [ ] Row-Level Security PostgreSQL en plus du cloisonnement applicatif
- [ ] Offres et facturation des établissements

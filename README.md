# Application de facturation pour Youlive Immobilier (English below)

## À propos

Ce projet est la propriété de Thibault Tuffin pour le compte de la société Youlive Immobilier. Ce dépôt est public afin de servir de vitrine pour les potentiels clients ou recruteurs souhaitant collaborer avec moi. Pour me contacter : thibault.tuffin@websmith.fr ou via websmith.fr.

## Description de l'application

Application de facturation des conseillers indépendants de Youlive Immobilier, développée avec Next.js. Elle calcule les rétrocessions d'honoraires, applique le seuil annuel de chiffre d'affaires, gère les parrainages et produit les factures.

### Importation automatisée depuis l'API d'Apimo

Chaque nuit, des tâches planifiées (Vercel Cron) enchaînent :

1. les conseillers actifs ;
2. les contrats en statut « Clôturé / Encaissé » ;
3. les propriétés associées aux contrats ;
4. les contacts liés aux contrats ;
5. la génération des factures des contrats récents.

Chaque passage est consigné dans un journal, et l'administration peut aussi lancer les synchronisations à la main.

### Deux espaces

#### Espace Admin

- **Paramètres conseillers** : informations de facturation, offre, TVA, rattachement aux parrains.
- **Inscription** : création d'un conseiller. L'administrateur ne saisit jamais de mot de passe : le conseiller reçoit un lien d'invitation signé (valable 48 h) et choisit le sien.
- **Suivi des factures** : tableau de bord de toutes les factures, changement de statut (envoyée / payée), avoirs et ajustements, annulation et remplacement d'une facture non envoyée.
- **Synchronisations** : lancement manuel des imports Apimo et journal des passages.
- **Documentation** : règles de facturation et mode d'emploi de l'espace admin.

#### Espace Conseiller

- **Mes factures** : consultation, saisie du numéro et de la date, génération dynamique du PDF (React), téléchargement ou envoi direct à Youlive.
- **Mes filleuls** : suivi des honoraires « agence » générés par les filleuls (plafonné à 70 000 € HT par an et par filleul).
- **Mon compte** : informations de facturation (ex. assujettissement à la TVA) et mot de passe.

### Règles de facturation

- **Facture de commission** : rétrocession du conseiller sur sa propre vente. Le taux dépend de l'offre (Youlive : 70 %, Découverte : 60 %) et passe à 99 % au-delà de 70 000 € de chiffre d'affaires annuel ; l'option d'auto-parrainage ajoute 6 points, dans la limite de 99 %.
- **Franchissement du seuil** : lorsqu'un contrat fait passer le conseiller au-dessus de 70 000 €, la commission est scindée en deux factures (avant et après seuil), calculées chronologiquement.
- **Facture de recrutement** : frais de parrainage reversés sur trois niveaux (6 % ou 8 %, 2 %, 1 %), tant que le filleul n'a pas atteint 70 000 €.
- **Avoirs et ajustements** : corrections établies par l'administration, sur une commission ou un recrutement.
- **TVA** : suit le profil du conseiller, avec une option propre aux recrutements.

## Points techniques

- **Next.js 16** (App Router, Turbopack) et TypeScript
- **Prisma 7** avec l'adaptateur `pg`, base **PostgreSQL** (Neon)
- **Tailwind CSS v4** et **shadcn/ui**
- **@react-pdf/renderer** pour les PDF, **SWR** pour les données côté client
- Authentification par **JWT** (`jose`) en cookie, deux rôles : `admin` et `conseiller` ; chaque route API vérifie elle-même la session
- Emails via SMTP ; hors production, tous les envois sont déroutés vers une adresse de test
- Déploiement sur **Vercel**, avec un environnement de préproduction (branche `preprod`)

### Démarrage

```bash
pnpm install
pnpm dev          # serveur de développement
pnpm build        # build de production
pnpm lint         # ESLint
pnpm test         # tests unitaires (node --test)
```

Le fichier `.env` doit définir au minimum `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, les variables `SMTP_*` et `NEXT_PUBLIC_BASE_URL`. Les migrations se gèrent avec `npx prisma migrate dev` (développement) et `npx prisma migrate deploy` (production).

Les conventions détaillées du projet figurent dans `CLAUDE.md`.

Pour une démonstration de l'application, merci de me contacter par email : thibault.tuffin@websmith.fr

---

# Billing Application for Youlive Real Estate

## About

This project is owned by Thibault Tuffin on behalf of Youlive Real Estate. This repository is public to showcase my work to potential clients or recruiters interested in collaborating with me. Contact me at: thibault.tuffin@websmith.fr or via websmith.fr.

## Application Description

A billing application for the independent agents of Youlive Real Estate, built with Next.js. It computes fee retrocessions, applies the annual revenue threshold, manages sponsorships and produces invoices.

### Automated import from the Apimo API

Scheduled jobs (Vercel Cron) run every night, in this order:

1. active agents;
2. contracts with "Closed / Paid" status;
3. properties associated with contracts;
4. contacts linked to contracts;
5. invoice generation for recent contracts.

Each run is recorded in a log, and administrators can also trigger the syncs manually.

### Two areas

#### Admin Area

- **Agent settings**: billing details, plan, VAT, sponsor assignment.
- **Registration**: agent creation. Admins never type a password: the agent receives a signed invitation link (valid for 48 hours) and chooses their own.
- **Invoice tracking**: dashboard of all invoices, status changes (sent / paid), credit notes and adjustments, cancellation and replacement of an unsent invoice.
- **Synchronizations**: manual launch of the Apimo imports and run log.
- **Documentation**: billing rules and a guide to the admin area.

#### Agent Area

- **My invoices**: browsing, entering the number and date, dynamic PDF generation (React), download or direct sending to Youlive.
- **My sponsored agents**: tracking of the "agency" fees generated by sponsored agents (capped at €70,000 excluding VAT per year per sponsored agent).
- **My account**: billing information (e.g., VAT status) and password.

### Billing rules

- **Commission invoice**: the agent's retrocession on their own sale. The rate depends on the plan (Youlive: 70%, Discovery: 60%) and rises to 99% above €70,000 of annual revenue; the self-sponsorship option adds 6 points, capped at 99%.
- **Threshold crossing**: when a contract takes the agent above €70,000, the commission is split into two invoices (before and after the threshold), computed chronologically.
- **Recruitment invoice**: sponsorship fees paid up a three-level tree (6% or 8%, 2%, 1%), as long as the sponsored agent has not reached €70,000.
- **Credit notes and adjustments**: corrections issued by the administration, on a commission or a recruitment invoice.
- **VAT**: follows the agent's profile, with a separate option for recruitment invoices.

## Technical Aspects

- **Next.js 16** (App Router, Turbopack) and TypeScript
- **Prisma 7** with the `pg` adapter, **PostgreSQL** database (Neon)
- **Tailwind CSS v4** and **shadcn/ui**
- **@react-pdf/renderer** for PDFs, **SWR** for client-side data
- **JWT** authentication (`jose`) in a cookie, two roles: `admin` and `conseiller`; every API route checks the session itself
- Email over SMTP; outside production, all outgoing mail is rerouted to a test address
- Deployed on **Vercel**, with a preproduction environment (`preprod` branch)

### Getting started

```bash
pnpm install
pnpm dev          # development server
pnpm build        # production build
pnpm lint         # ESLint
pnpm test         # unit tests (node --test)
```

The `.env` file must define at least `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, the `SMTP_*` variables and `NEXT_PUBLIC_BASE_URL`. Migrations are handled with `npx prisma migrate dev` (development) and `npx prisma migrate deploy` (production).

Detailed project conventions are in `CLAUDE.md`.

For a demonstration of the application, please contact me by email: thibault.tuffin@websmith.fr

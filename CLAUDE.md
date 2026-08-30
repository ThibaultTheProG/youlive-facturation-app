# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm vercel-build # Used by Vercel: prisma generate && next build
```

Database migrations:
```bash
npx prisma migrate dev    # Create and apply a migration
npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma studio         # Open Prisma Studio GUI
```

There are no automated tests.

## Travailler en préproduction

Le développement se fait sur la branche git `preprod` et sur la branche Neon `Preproduction`
(`br-royal-pine-b1mmspwb`, endpoint `ep-square-lake`), dont l'URL est dans `PREPROD_DATABASE_URL`.
Le `DATABASE_URL` du `.env` pointe, lui, toujours sur la **production** (`ep-odd-river`).

```bash
DATABASE_URL="$PREPROD_DATABASE_URL" pnpm dev
```

`src/lib/db.ts` lit `DATABASE_URL`, et Next n'écrase pas une variable déjà présente dans
l'environnement du shell — le préfixe suffit donc. Sans lui, le serveur de dev écrit en
production. Même logique pour toute commande Prisma.

Sur Vercel, la branche `preprod` est reliée à l'environnement personnalisé **staging**.

### Emails : déroutage hors production (obligatoire)

`src/lib/environnement.ts` est le **point d'entrée unique** de tout comportement dépendant de
l'environnement. Ne jamais relire `VERCEL_ENV` ailleurs (même règle que `devAuth.ts`).

- `estProduction()` — vrai **uniquement** si `VERCEL_ENV === "production"`. `NODE_ENV` ne convient
  pas : Vercel le fixe à `"production"` sur *tous* les déploiements, staging compris.
- `destinataires(voulus)` — la liste demandée en production, l'adresse de déroutage partout
  ailleurs (`EMAIL_REDIRECTION`, à défaut `thibault.tuffin@youlive-immobilier.fr`).
- `sujet(sujetVoulu, voulus)` — préfixe hors production par `[staging → destinataires réels]`,
  sans quoi un email dérouté est indiscernable d'un email correctement adressé.
- `emailsAdminFactures()` — `FACTURES_ADMIN_EMAILS` (liste séparée par des virgules), à défaut
  `SMTP_TO_EMAIL`. Les adresses des destinataires admin ne sont plus en dur dans le code.

Le défaut est délibérément sûr : il faut une production explicite pour écrire à de vraies
personnes. **Tout nouvel envoi d'email doit passer par `destinataires()` et `sujet()`.** Les trois
points d'envoi existants sont `src/lib/email.ts` (invitation, → le conseiller),
`/api/factures/create` (notification de facture, → le conseiller, une par facture du cron nocturne)
et `/api/factures/send` (→ l'administration).

`JWT_SECRET` et `CRON_SECRET` **doivent différer entre staging et production** : partagés, un
cookie `authToken` ou un jeton `set-password` émis par staging serait valide en production.

## Cette base est partagée avec une seconde application

L'application **avis de valeur** (`../avis_de_valeur/avisdevaleur`) vit dans la même base
`facturation`, sur son propre schéma `avis_de_valeur`. Elle lit `public.utilisateurs` — et rien
d'autre de `public` — pour authentifier les conseillers, la facturation restant la source de
vérité unique des comptes, des rôles et des mots de passe.

Le contrat entre les deux applications est dans `../contrat/`, importé ci-dessous. C'est le seul
endroit où ce que l'une doit savoir de l'autre est écrit : deux sessions Claude ne partagent ni
conversation ni mémoire.

@../contrat/UTILISATEURS.md
@../contrat/SCHEMAS_ET_ROLES.md
@../contrat/EVOLUTIONS.md

Ce que cela impose ici, concrètement :

- **Onze colonnes de `utilisateurs` sont sous contrat** (voir `UTILISATEURS.md`). En ajouter est
  libre ; en renommer, retyper ou supprimer une casse l'autre application — y compris élargir un
  `VarChar(50)`, qui ne casse rien à l'exécution mais fait échouer sa vérification de schéma.
  Séquencer selon la règle d'ordre du contrat, et inscrire le changement dans `EVOLUTIONS.md`.
- **Ne pas activer `multiSchema`** dans le datasource sans relire `SCHEMAS_ET_ROLES.md` : Prisma
  ne voit aujourd'hui que `public`, et c'est ce qui garde le schéma voisin hors de sa portée.
- **Ne pas utiliser `prisma migrate dev`.** Deux raisons cumulées. D'une part le `DATABASE_URL`
  du `.env` local pointe sur la production (`ep-odd-river`, `neondb_owner`). D'autre part
  l'historique `prisma/migrations` **ne décrit plus la base** : il s'arrête au 12/03/2025, alors
  que `utilisateurs.actif`, `utilisateurs.taux_tva`, la table `historique_ca_annuel` ou
  `factures.statut_envoi` existent en base sans migration correspondante. `migrate dev` détectera
  donc une dérive et proposera un `migrate reset`, qui supprime le schéma `public` en entier.
  Tant que l'historique n'est pas rebaselé : écrire le `migration.sql` à la main dans un dossier
  `prisma/migrations/<timestamp>_<slug>/`, puis appliquer par `prisma migrate deploy`, qui ne
  vérifie jamais la dérive et ne propose jamais de reset. Voir le point 4 de `EVOLUTIONS.md`.


## Architecture

### Stack
- **Next.js 16** (App Router) with TypeScript and Turbopack
- **Prisma 7** with `@prisma/adapter-pg` (PostgreSQL via `pg` Pool) — see `src/lib/db.ts`
- **Tailwind CSS v4** + **shadcn/ui** components in `src/components/ui/`
- **@react-pdf/renderer** for client-side PDF generation
- **SWR** for data fetching in client components
- **JWT** (via `jose`) stored in `authToken` cookie, 1h expiry, two roles: `admin` and `conseiller`

### Authentication & Routing
The Next.js middleware is split across two files:
- `src/proxy.ts` — the actual middleware logic (auth check, role-based redirects)
- `middleware.config.mjs` — exports the `config` with `matcher` patterns

Auth is handled in `src/lib/auth.ts`. Le bypass `NEXT_PUBLIC_AUTH_DISABLED=true` (dev/test) passe **exclusivement** par `src/lib/devAuth.ts` (`isAuthDisabled()` / `devUser()`), qui le refuse dès que `NODE_ENV === "production"` — la variable étant `NEXT_PUBLIC_`, elle est lisible dans le bundle client. Ne jamais relire `process.env.NEXT_PUBLIC_AUTH_DISABLED` ailleurs (middleware, layouts, AuthProvider et gardes API passent tous par ce helper).

En mode bypass, le middleware n'applique aucun contrôle de rôle sur les pages, mais les gardes API appliquent celui de `NEXT_PUBLIC_TEST_USER_ROLE` : travailler dans `/admin` avec `NEXT_PUBLIC_TEST_USER_ROLE=conseiller` donne des `403` sur les routes admin. Basculer la variable (et `NEXT_PUBLIC_TEST_USER_ID`) selon l'espace testé — le message d'erreur 403 le rappelle explicitement en dev.

### Protection des routes API (obligatoire)
Le middleware exclut `/api` de son matcher : **aucune route API n'est protégée par défaut**. Chaque handler doit appeler une garde de `src/lib/apiAuth.ts` en première instruction :
- `requireUser()` — session valide
- `requireAdmin()` — rôle `admin`
- `requireSelfOrAdmin(targetId)` — admin, ou propriétaire de la ressource
- `requireCronOrAdmin(request)` — `Authorization: Bearer $CRON_SECRET` (envoyé par les crons Vercel) ou session admin

`CRON_SECRET` doit être défini côté Vercel, sinon les 5 crons nocturnes reçoivent un `401` et toute la chaîne de synchronisation/facturation s'arrête silencieusement.

Sur `PUT /api/conseillers`, le corps de requête n'est jamais passé tel quel à Prisma pour un conseiller : `CHAMPS_CONSEILLER` liste les seuls champs qu'il peut modifier sur sa fiche (mass assignment → `role: "admin"`), et le bloc parrainages est réservé à l'admin (le formulaire conseiller n'envoie pas de `parrain_id` et effaçait l'arbre de parrainage).

### Activation de compte (mot de passe)
L'admin ne saisit jamais de mot de passe. `POST /api/auth/invitation` (admin) envoie au conseiller un lien signé vers `/definir-mot-de-passe`, où il choisit le sien via `POST /api/auth/set-password`. Aucun secret ne transite par email.

Le jeton (`src/lib/passwordSetup.ts`) est un JWT HS256 d'audience `set-password`, valable 48h, dont le payload embarque `k` = empreinte SHA-256 du hash bcrypt au moment de l'émission. À la vérification, l'empreinte est recomparée au hash en base : **usage unique sans table dédiée** (dès que le mot de passe change, tous les jetons émis avant deviennent invalides). Ne pas remplacer par un jeton opaque sans prévoir la migration Prisma correspondante.

`/definir-mot-de-passe` et `POST|GET /api/auth/set-password` sont publics **par construction** : c'est le jeton de l'URL qui authentifie. L'exception est déclarée explicitement dans `src/proxy.ts`.

Politique de mot de passe : `src/lib/passwordPolicy.ts` (`LONGUEUR_MIN_MOT_DE_PASSE = 8`), module volontairement sans dépendance serveur pour être importable par les formulaires client — `src/lib/password.ts` tire `bcryptjs`. La validation du formulaire de connexion reste à 6 : la relever bloquerait les comptes existants dont le mot de passe fait 6 ou 7 caractères.

Coût bcrypt : 12 (`BCRYPT_COST` dans `src/lib/password.ts`). Le facteur de travail étant stocké dans le hash, les mots de passe existants en coût 10 continuent de fonctionner et sont réhachés en 12 au prochain changement.

`verifyToken` valide la forme du payload (`estPayloadValide` : id entier positif, rôle `admin`/`conseiller`, name/email en `string`) et épingle `algorithms: ["HS256"]`. Les appelants peuvent exploiter son retour tel quel — ne pas réintroduire de contrôles de forme en aval.

### Two Application Areas
- `/admin` — admin only: agent settings (`parametres`), invoice dashboard (`suiviFactures`), agent registration (`inscription`)
- `/conseiller` — conseiller only: invoices (`factures`), sponsored agents (`filleuls`), account settings (`compte`)

Routes publiques : `/login` et `/definir-mot-de-passe` (lien d'invitation). `/factures/[id]/pdf` (PDF viewer) est bien couvert par le matcher du middleware et exige une session ; l'API qu'il consomme (`/api/factures/[id]`) vérifie en plus que la facture appartient au demandeur.

### Invoice Generation (Core Business Logic)
Toutes les routes de synchronisation partagent le même socle : `src/utils/apimo.ts` (`fetchApimoAll`, pagination) et `src/utils/sync.ts` (`runChunked`, `memeMontant`, `memeJour`, `memeTexte`). Le schéma imposé est **précharger en quelques SELECT → diff en mémoire → n'écrire que le delta**, jamais une requête Prisma par élément Apimo (cf. Known pitfalls).

Invoices are auto-created nightly via Vercel cron jobs (`vercel.json`) in this sequence:
1. `/api/conseillers` → sync agents from Apimo
2. `/api/contrats` → sync contracts from Apimo
3. `/api/proprietes` → sync properties
4. `/api/contacts` → sync contacts
5. `/api/factures/create` → generate invoices for recent contracts (last 7 days)

The main invoice creation logic is in `src/app/api/factures/create/route.ts`.

**Two invoice types:**
- `commission` — agent's retrocession on their own sale
- `recrutement` — sponsorship fees paid upward through the sponsor tree (up to 3 levels)

**Retrocession rates** (`src/utils/calculs.tsx`):
- "Offre Youlive": 70% below €70k CA threshold, 99% above
- "Offre Découverte": 60% below, 99% above
- `auto_parrain = "oui"` adds +6%, capped at 99%

**Threshold splitting:** When a new contract crosses the €70k annual CA threshold, the commission is split into two invoices: `tranche: "avant_seuil"` and `tranche: "apres_seuil"`, each at the appropriate rate. The split is computed **chronologically**: in `factures/create`, recent contracts are sorted by `date_signature` ascending, and the threshold is applied against an **accumulated CA** that starts from the conseiller's already-invoiced CA for the year (sum of `montant_honoraires` of existing commission invoices) and grows contract by contract. Never derive the per-contract "CA before" from `getCAForYear` minus the contract — that total already includes all recent contracts and misattributes the crossing when a conseiller has several new contracts at once.

**Sponsorship fees** (recrutement invoices):
- niveau1: 6% (or 8% if parrain has ≥5 filleuls)
- niveau2: 2%
- niveau3: 1%
- Capped: no recrutement invoices generated if the filleul's CA ≥ €70k

Annual CA is tracked in `historique_ca_annuel` (source of truth) and cached in `utilisateurs.chiffre_affaires`. See `src/utils/historiqueCA.ts`.

**CA recomputation (idempotent, not incremental):** On each `/api/contrats` sync, `historique_ca_annuel.chiffre_affaires` is **recomputed by SUM** (set, not incremented) as the total of `honoraires_agent` of all type-9 entries of the conseiller for the contract year, via `recomputeCAForYear`. This is idempotent: it self-heals when Apimo revises an amount or when a relation was previously missed, and it never double-counts across runs. `recomputeCAForYear` skips any year already closed (`date_cloture` set), recomputes `retrocession_finale`, and syncs the `utilisateurs` cache only for the current year. The old incremental `updateCACurrentYear` is no longer used by the sync.

**vat / vat_rate = 0 are valid:** In `/api/contrats`, an entry is imported when `id`, `user`, and `amount` are present. `vat`/`vat_rate` of `0` (conseillers not subject to VAT) are valid and must NOT be rejected — otherwise the relation is never created and its CA is silently lost.

#### Known pitfalls (regression guards)
- **Under-counted CA at import:** Do not reintroduce truthiness checks like `if (!vat || !vat_rate) continue` — they drop `0` (non-VAT conseillers). Only `id`, `user`, `amount` are mandatory. Likewise, do not resurrect the incremental `updateCACurrentYear` / the 5-second `created_at` "isNewRelation" heuristic in the sync: it double-counts on repeated runs and never catches revised amounts. CA is recomputed by SUM.
- **Mis-split threshold across multiple contracts:** Do not compute the per-contract "CA before" as `getCAForYear(...) - honoraires_agent`. Sort the contracts to invoice by `date_signature` ascending and accumulate CA from the already-invoiced base; pass that `currentCA` into `createFactureCommission`. The core split logic in `factures/create` (the `montantAvantSeuil` / `montantApresSeuil` branches) is correct and must not be altered.
- **Pagination Apimo (plafond 10 000):** les endpoints Apimo sont paginés et une requête sans `limit`/`offset` est plafonnée à 10 000 éléments — au-delà, la troncature est **silencieuse**. C'est ce qui privait `/api/contacts` de 4 583 contacts (14 583 au total), laissant 236 contacts référencés par des contrats absents de la base. Toujours passer par `fetchApimoAll` (`src/utils/apimo.ts`), qui déroule les pages jusqu'à `total_items`. Ne jamais réintroduire un `fetch` direct sur `api.apimo.pro`.
- **Timeout 504 du cron `/api/contrats`:** la route ne doit jamais refaire une requête Prisma par contrat/entry. Elle précharge en 4 SELECT (`utilisateurs`, `contrats`, `relations_contrats`, `historique_ca_annuel`), calcule le diff en mémoire et n'écrit que le delta, via `runChunked` (concurrence 5, sous la taille du pool pg). Le volume de contrats step 4 croît en continu : une boucle séquentielle finit fatalement par dépasser `maxDuration`. Le recalcul du CA étant en fin de route, un timeout partiel le saute silencieusement et laisse `historique_ca_annuel` périmé — donc des taux de rétrocession faux.
- **`utilisateurs.siren` est du texte libre, jamais un nombre:** c'est le champ d'identifiant
  légal du conseiller (libellé `SIREN / RSAC / RCS` dans les formulaires), et **c'est là que se
  lit le numéro RSAC** — il n'y a pas de colonne `rsac`. Il appartient à Apimo
  (`partners[0].reference`) et la sync `/api/conseillers` l'écrase chaque nuit : ne jamais
  l'écrire depuis l'app. Son contenu est hétérogène (`"0"`, `"831 555 339"`, une phrase de 118
  caractères pour six conseillers en portage) : le déclarer `number` ou le passer à `parseInt` /
  `Number` tronque ou vide la valeur de 11 conseillers sur 114. C'était le cas jusqu'au
  30/08/2026 dans `src/lib/types.ts` et les mappings de `/api/conseiller` et `/api/factures/[id]`.
- **`contrats.date_signature` est un `timestamp` sans fuseau:** comparer deux valeurs avec `getTime()` fait diverger toutes les lignes selon le fuseau du process. Comparer le jour en composantes UTC (`toISOString().slice(0, 10)` vs `contract_at`).
- One-shot recompute + audit script: `scripts/migrate-ca-2026.ts` (re-fetches Apimo, sets `historique_ca_annuel` for 2026, and reports — without modifying — inconsistent commission invoices to regenerate).

### Key Files
- `src/lib/types.ts` — all shared TypeScript interfaces (`Conseiller`, `Facture`, `FactureDetaillee`, `Contract`, etc.)
- `src/lib/db.ts` — singleton Prisma client with pg Pool adapter
- `src/backend/gestionFactures.tsx` — server action for fetching a conseiller's invoices
- `src/app/factures/[id]/pdf/` — PDF rendering pages (`FactureCommission.tsx`, `FactureRecrutement.tsx`)
- `prisma/schema.prisma` — DB schema (tables: `utilisateurs`, `factures`, `relations_contrats`, `contrats`, `parrainages`, `historique_ca_annuel`, `contacts`, `property`)
- `prisma.config.ts` — Prisma config pointing to `prisma/schema.prisma`

### Environment Variables
Required: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `SMTP_SERVER_HOST`, `SMTP_SERVER_PORT`, `SMTP_SERVER_USERNAME`, `SMTP_SERVER_PASSWORD`, `SMTP_FROM_EMAIL`, `NEXT_PUBLIC_BASE_URL`

Optional: `NEXT_PUBLIC_AUTH_DISABLED=true` to bypass authentication (sans effet sur Vercel, où
`NODE_ENV` vaut toujours `production`) · `PREPROD_DATABASE_URL` (branche Neon Preproduction, cf.
« Travailler en préproduction ») · `FACTURES_ADMIN_EMAILS` (destinataires admin, liste séparée par
des virgules ; à défaut `SMTP_TO_EMAIL`) · `EMAIL_REDIRECTION` (adresse recevant tout le courrier
hors production ; à défaut `thibault.tuffin@youlive-immobilier.fr`)

`VERCEL_ENV` est fourni par Vercel et ne se définit pas à la main.

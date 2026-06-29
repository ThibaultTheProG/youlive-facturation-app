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

Auth is handled in `src/lib/auth.ts`. The `NEXT_PUBLIC_AUTH_DISABLED=true` env var disables auth entirely (for dev/testing).

### Two Application Areas
- `/admin` — admin only: agent settings (`parametres`), invoice dashboard (`suiviFactures`), agent registration (`inscription`)
- `/conseiller` — conseiller only: invoices (`factures`), sponsored agents (`filleuls`), account settings (`compte`)

Public routes: `/login`, `/factures/[id]/pdf` (PDF viewer)

### Invoice Generation (Core Business Logic)
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
- One-shot recompute + audit script: `scripts/migrate-ca-2026.ts` (re-fetches Apimo, sets `historique_ca_annuel` for 2026, and reports — without modifying — inconsistent commission invoices to regenerate).

### Key Files
- `src/lib/types.ts` — all shared TypeScript interfaces (`Conseiller`, `Facture`, `FactureDetaillee`, `Contract`, etc.)
- `src/lib/db.ts` — singleton Prisma client with pg Pool adapter
- `src/backend/gestionFactures.tsx` — server action for fetching a conseiller's invoices
- `src/app/factures/[id]/pdf/` — PDF rendering pages (`FactureCommission.tsx`, `FactureRecrutement.tsx`)
- `prisma/schema.prisma` — DB schema (tables: `utilisateurs`, `factures`, `relations_contrats`, `contrats`, `parrainages`, `historique_ca_annuel`, `contacts`, `property`)
- `prisma.config.ts` — Prisma config pointing to `prisma/schema.prisma`

### Environment Variables
Required: `DATABASE_URL`, `JWT_SECRET`, `SMTP_SERVER_HOST`, `SMTP_SERVER_PORT`, `SMTP_SERVER_USERNAME`, `SMTP_SERVER_PASSWORD`, `SMTP_FROM_EMAIL`, `NEXT_PUBLIC_BASE_URL`

Optional: `NEXT_PUBLIC_AUTH_DISABLED=true` to bypass authentication

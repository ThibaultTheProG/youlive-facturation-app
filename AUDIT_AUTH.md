# Audit technique — Système d'authentification `youlive-facturation-app`

> Branche `main` · driver `pg` + Prisma 7 · Next.js 16 (App Router). Aucun fichier de code/config n'a été modifié pendant cet audit.

## 1. Approche d'auth

**Custom (maison)** — aucune librairie d'auth tierce (pas de NextAuth/Auth.js, Lucia, Clerk). Briques utilisées :
- `jose` `^6.2.3` — signature/vérification JWT (`src/lib/auth.ts`)
- `bcryptjs` `2.4.3` — hachage des mots de passe (`src/lib/password.ts`)

**Flux :**
1. `POST /api/auth/login` avec `{ email, password }`.
2. Lookup Prisma sur `utilisateurs` (`findFirst` par email, avec `motDePasse != null` et `role != null`).
3. `bcryptjs.compareSync(password, hash)`.
4. Si OK → génération d'un JWT HS256 (`jose`) → posé dans le cookie `authToken`.
5. À chaque requête de page, le middleware (`src/proxy.ts`) lit le cookie, vérifie le JWT et applique les règles de rôle.

## 2. Stratégie de session

**Stateless — JWT** (aucune session en base, pas de table de sessions).

- **Cookie :** `authToken`
- **Algorithme :** HS256, signé avec `JWT_SECRET` (`src/lib/auth.ts:24`)
- **Payload :** `{ id, role, name, email }` (`src/lib/auth.ts:17-27`)
- **Durée de vie :** JWT `setExpirationTime("1h")` **et** cookie `maxAge: 3600` (1 h) — cohérents.

Attributs du cookie posés au login (`src/app/api/auth/login/route.ts:64-69`) :

| Attribut | Valeur |
|---|---|
| `httpOnly` | `true` |
| `secure` | `process.env.NODE_ENV === "production"` (donc **false en dev**) |
| `path` | `/` |
| `maxAge` | `3600` (1 h) |
| `SameSite` | **non défini explicitement** → défaut Next.js = `Lax` |
| `Domain` | **non défini** → cookie host-only (limité au domaine exact qui le pose) |

```ts
response.cookies.set("authToken", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60, // 1 heure
});
```

> ⚠️ Point clé pour un partage entre sous-domaines (cf. §10) : `Domain` n'étant pas posé, le cookie est **host-only** et ne sera **pas** envoyé à un autre sous-domaine. `SameSite=Lax` empêche aussi l'envoi sur des requêtes cross-site (`fetch` cross-origin).

## 3. Stockage des identifiants

**Table : `utilisateurs`** (Postgres) — colonnes complètes (`prisma/schema.prisma`) :

| Colonne | Type Prisma / DB |
|---|---|
| `id` | `Int` PK `@default(autoincrement())` |
| `motDePasse` | `String?` `@db.Char(60)` ← hash bcrypt |
| `prenom` | `String?` `@db.VarChar(50)` |
| `nom` | `String?` `@db.VarChar(50)` |
| `email` | `String?` `@db.VarChar(255)` |
| `telephone` | `String?` `@db.VarChar(60)` |
| `adresse` | `String?` `@db.VarChar(255)` |
| `role` | `String?` `@db.VarChar(50)` (valeurs `admin` / `conseiller`) |
| `created_at` | `DateTime?` `@db.Timestamp(6)` |
| `updated_at` | `DateTime?` `@db.Timestamp(6)` |
| `idapimo` | `Int` `@unique` |
| `tva` | `Boolean?` |
| `typecontrat` | `String?` `@db.VarChar(100)` |
| `siren` | `String?` `@db.VarChar(255)` |
| `chiffre_affaires` | `Decimal?` `@db.Decimal(10,2)` |
| `retrocession` | `Decimal?` `@db.Decimal(5,2)` |
| `auto_parrain` | `String?` `@default("non")` `@db.VarChar(3)` |
| `mobile` | `String?` `@db.VarChar(60)` |
| `adresse_facture` | `String?` `@db.VarChar(255)` |
| `nom_societe_facture` | `String?` `@db.VarChar(255)` |
| `siren_facture` | `String?` `@db.VarChar(255)` |
| `taux_tva` | `Decimal?` `@db.Decimal(5,2)` |
| `actif` | `Boolean` `@default(true)` |

Relations : `factures[]`, `parrainages?`, `relations_contrats[]`, `historique_ca_annuel[]`.

**Hachage : bcrypt** (`bcryptjs`), salt `genSaltSync(10)` (cost factor 10). Appelé dans :
- `src/lib/password.ts` (`hashPassword` / `comparePassword`)
- `src/app/api/auth/hash/route.ts` (route exposant hash/compare)
- Vérification au login : `src/app/api/auth/login/route.ts:45`
- Écriture du hash : `src/app/api/change-password/route.ts:39-48` et `src/app/api/assignPassword/route.tsx:75-85`

> Remarque : la colonne est `Char(60)`, conforme à un hash bcrypt. `motDePasse` est **nullable** → des utilisateurs sans mot de passe existent (filtrés au login).

## 4. Endpoints login / logout

**Login — `POST /api/auth/login`** (`src/app/api/auth/login/route.ts`, `runtime = 'nodejs'`)
- Requête : `{ "email": string, "password": string }` (JSON)
- Réponses :
  - `200` → `{ message: "Connexion réussie", role }` + `Set-Cookie: authToken=<JWT>`
  - `400` email/password manquant · `404` utilisateur non trouvé · `401` mot de passe incorrect · `500`

**Logout — `POST /api/auth/logout`** (`src/app/api/auth/logout/route.ts`)
- Pas de body. Réponse `200` → `{ success: true }` + suppression du cookie `authToken`.

**Annexes liées à l'auth :**
- `GET /api/auth/me` → renvoie `{ id, email, role }` depuis le JWT (`401` si absent/invalide).
- `POST /api/auth/hash` → `{ password, action: "hash"|"compare", hash? }` → **route publique non protégée** exposant un oracle de hash/compare bcrypt. ⚠️
- `POST /api/change-password` → `{ password }`, exige cookie `authToken` valide ; met à jour le mot de passe de l'utilisateur du token.
- `POST /api/assignPassword` → `{ conseillerId, password }` ; **aucune vérification d'auth/rôle** : hash + email du mot de passe en clair. ⚠️

## 5. Vérification d'une requête authentifiée

Deux mécanismes distincts, **non unifiés** :

**(a) Pages** — middleware `src/proxy.ts` (déclaré via `middleware.config.mjs`, `runtime: 'nodejs'`). Le matcher couvre `/admin/*`, `/conseiller/*`, `/login` et **exclut explicitement `/api`** :

```ts
const token = request.cookies.get("authToken")?.value;
if (!token) return NextResponse.redirect(new URL("/login", request.url));
const user = await verifyToken(token);
if (!user) return NextResponse.redirect(new URL("/login", request.url));
if (pathname.startsWith("/admin") && user.role !== "admin") /* redirect /login */
if (pathname.startsWith("/conseiller") && user.role !== "conseiller") /* redirect /login */
```

**(b) Routes API** — le middleware **ne protège PAS `/api`** (ligne `pathname.startsWith('/api')` → `NextResponse.next()`, et exclusion dans le matcher). Chaque route API doit donc se protéger elle-même. En pratique :
- `change-password` et `me` re-vérifient le cookie via `verifyToken` (`src/lib/auth.ts:30`).
- **La plupart des autres routes API** (`/api/conseillers`, `/api/factures/*`, `/api/assignPassword`, `/api/auth/hash`, etc.) **ne font aucune vérification d'auth**. ⚠️

```ts
// src/lib/auth.ts
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY) as { payload: JWTPayload };
    return payload;
  } catch (error) { return null; }
}
```

> Il existe aussi un bypass global : `NEXT_PUBLIC_AUTH_DISABLED=true` désactive entièrement l'auth (middleware + `AuthProvider` injecte un utilisateur de test). À ne jamais activer en prod.

## 6. API réutilisable par une autre application

- **(a) Authentifier un conseiller :** ✅ partiellement. `POST /api/auth/login` accepte `{ email, password }` et renvoie `{ role }`, mais le JWT n'est délivré **que via un cookie `Set-Cookie` `httpOnly`** — il n'est **pas renvoyé dans le corps JSON**. Une app tierce cross-origin ne pourrait donc pas récupérer le token de façon exploitable (et CORS n'est pas configuré, cf. §8). Contrat actuel : cookie-based, pensé pour le même domaine uniquement.
- **(b) Valider un token/session existant :** ✅ `GET /api/auth/me` valide le cookie `authToken` et renvoie `{ id, email, role }` (`401` sinon). Mais il lit **le cookie**, pas un header `Authorization` → réutilisable seulement si l'appelant partage le cookie (même domaine/sous-domaine compatible).

**Conclusion :** il n'existe **aucun endpoint conçu comme API d'auth machine-to-machine** (pas de token dans le body, pas de validation par header Bearer, pas de CORS). Une intégration inter-app nécessiterait des ajouts. *(Note : `/api/auth/hash` expose hash/compare bcrypt mais ne valide pas d'identité — non pertinent et risqué.)*

## 7. Accès base de données

- **ORM :** Prisma `^7.8.0` (`@prisma/client`) avec l'adaptateur **`@prisma/adapter-pg` `^7.8.0`** (`PrismaPg`) au-dessus d'un **`pg.Pool`** (`pg ^8.20.0`).
- **Config** (`src/lib/db.ts`) : singleton Prisma, `Pool({ connectionString: process.env.DATABASE_URL })`, logs `['query','error','warn']`. En non-prod, instance mise en cache sur `global.prisma`.
- **Neon :** la connexion prod pointe vers **Neon** (`...@ep-shrill-bush-a9suadrz-pooler.gwc.azure.neon.tech`, endpoint **`-pooler`** = PgBouncer de Neon, région Azure `gwc`). ⚠️ La connexion se fait via le **driver `pg` standard sur l'URL pooler Neon**, et **non** via `@neondatabase/serverless` (absent des dépendances). En dev, `DATABASE_URL` pointe sur `localhost:5433`.
- `prisma.config.ts` pointe vers `prisma/schema.prisma`.

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = global.prisma || new PrismaClient({ adapter, log: ['query','error','warn'] });
```

## 8. CORS

**Aucune configuration CORS** — recherche `Access-Control` / `cors` / `Allow-Origin` dans `src/` : **0 résultat**. Pas de headers CORS dans `next.config.ts` (`next.config.*` ne contient que `devIndicators` et `serverExternalPackages: ["bcryptjs"]`), pas de middleware CORS, aucun header `Access-Control-*` posé sur les routes API.

→ Comportement par défaut Next.js : **same-origin**. Toute consommation cross-origin des API (y compris login depuis une autre app) échouera côté navigateur tant que CORS n'est pas ajouté.

## 9. Variables d'environnement (noms uniquement)

Liées à l'auth / base :
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `NEXT_PUBLIC_AUTH_DISABLED`
- `NEXT_PUBLIC_TEST_USER_ID`
- `NEXT_PUBLIC_TEST_USER_NAME`
- `NEXT_PUBLIC_TEST_USER_EMAIL`
- `NEXT_PUBLIC_TEST_USER_ROLE`
- `NEXT_PUBLIC_BASE_URL`

Autres présentes dans le code (hors périmètre strict auth, listées pour exhaustivité) : `USERNAME`, `PASSWORD` (Basic auth vers l'API Apimo), `SMTP_SERVER_HOST`, `SMTP_SERVER_PORT`, `SMTP_SERVER_USERNAME`, `SMTP_SERVER_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_TO_EMAIL`.

## 10. Domaine / sous-domaine de production

**Non trouvé** dans le code/la config versionnés.
- `NEXT_PUBLIC_BASE_URL` = `http://localhost:3000` (valeur de dev dans `.env`).
- Pas de dossier `.vercel/` lié, pas de domaine custom ni de `vercel.app` référencé.
- Indices indirects : déploiement **Vercel** (`vercel.json` présent, crons Vercel), repo GitHub `ThibaultTheProG/youlive-facturation-app` → l'URL de prod est vraisemblablement un sous-domaine `*.vercel.app` ou un domaine custom, mais **introuvable dans le dépôt**. À confirmer dans le dashboard Vercel.

> **Implication partage de cookie inter-sous-domaines :** en l'état c'est **impossible**. Le cookie `authToken` est posé **sans attribut `Domain`** (host-only) et **sans `SameSite=None`** (défaut `Lax`). Pour partager la session entre `app.exemple.fr` et `autre.exemple.fr`, il faudrait (a) poser `Domain=.exemple.fr`, (b) éventuellement `SameSite=None; Secure` selon le contexte cross-site, (c) configurer CORS avec `credentials`, et (d) que les deux apps partagent le même `JWT_SECRET` pour valider le JWT. Aucun de ces éléments n'est présent aujourd'hui.

---

## Synthèse des risques notables (hors périmètre des 10 points, signalés au passage)

| Sévérité | Constat |
|---|---|
| 🔴 Élevé | Routes API **non protégées** par le middleware (`/api` exclu) ; la majorité ne vérifie pas le token (`/api/assignPassword`, `/api/conseillers`, `/api/factures/*`…). |
| 🔴 Élevé | `POST /api/auth/hash` : oracle public de hash/compare bcrypt, sans auth. |
| 🟠 Moyen | `POST /api/assignPassword` envoie le **mot de passe en clair par email** et n'exige aucun rôle admin. |
| 🟠 Moyen | `NEXT_PUBLIC_AUTH_DISABLED` désactive toute l'auth — variable publique (préfixe `NEXT_PUBLIC_`). |
| 🟡 Faible | `verifyToken` ne valide pas explicitement `role`/`exp` au-delà du défaut `jose` ; payload casté sans contrôle de forme. |

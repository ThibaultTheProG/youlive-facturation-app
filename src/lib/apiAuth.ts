import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, type User } from "@/lib/auth";
import { devUser, isAuthDisabled } from "@/lib/devAuth";

/**
 * Garde d'authentification pour les routes `/api/*`.
 *
 * Le middleware (`src/proxy.ts` + `middleware.config.mjs`) exclut explicitement
 * `/api` de son matcher : aucune route API n'est protégée par défaut. Chaque
 * handler DOIT donc appeler une des gardes ci-dessous en première instruction.
 *
 * Convention d'usage :
 *   const auth = await requireUser();
 *   if ("error" in auth) return auth.error;
 *   const { user } = auth;
 */
export type Guard = { user: User } | { error: NextResponse };

const unauthorized = () =>
  NextResponse.json({ error: "Non authentifié" }, { status: 401 });

/**
 * En mode bypass de dev, le middleware laisse entrer dans `/admin` comme dans
 * `/conseiller` sans regarder le rôle, alors que les gardes API l'appliquent
 * (elles reflètent la prod). Le 403 qui en résulte est correct mais opaque :
 * on nomme explicitement la variable à changer.
 */
const forbidden = (attendu?: "admin") => {
  if (isAuthDisabled()) {
    return NextResponse.json(
      {
        error: `Accès refusé. NEXT_PUBLIC_AUTH_DISABLED=true et NEXT_PUBLIC_TEST_USER_ROLE=${
          process.env.NEXT_PUBLIC_TEST_USER_ROLE ?? "conseiller"
        }${
          attendu ? ` : cette route exige le rôle "${attendu}"` : ""
        }. Ajustez NEXT_PUBLIC_TEST_USER_ROLE (et NEXT_PUBLIC_TEST_USER_ID) dans .env.`,
      },
      { status: 403 }
    );
  }
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
};

/** Lit le cookie `authToken` et renvoie l'utilisateur, ou null. */
export async function getSessionUser(): Promise<User | null> {
  const bypass = devUser();
  if (bypass) return bypass;

  const token = (await cookies()).get("authToken")?.value;
  if (!token) return null;

  // `verifyToken` valide déjà la forme du payload (id entier, rôle connu) :
  // inutile de recontrôler ici, un retour non nul est exploitable tel quel.
  return verifyToken(token);
}

/** Exige une session valide (admin ou conseiller). */
export async function requireUser(): Promise<Guard> {
  const user = await getSessionUser();
  return user ? { user } : { error: unauthorized() };
}

/** Exige une session valide avec le rôle `admin`. */
export async function requireAdmin(): Promise<Guard> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (user.role !== "admin") return { error: forbidden("admin") };
  return { user };
}

/**
 * Exige que l'utilisateur soit admin, ou qu'il agisse sur ses propres données.
 * `targetId` est l'id d'utilisateur visé par la requête.
 */
export async function requireSelfOrAdmin(
  targetId: number | null | undefined
): Promise<Guard> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (user.role === "admin") return { user };
  if (targetId == null || Number(targetId) !== user.id) return { error: forbidden() };
  return { user };
}

/**
 * Routes déclenchées par les crons Vercel (`vercel.json`).
 * Vercel envoie `Authorization: Bearer $CRON_SECRET` quand la variable
 * d'environnement `CRON_SECRET` est définie sur le projet. On accepte aussi
 * une session admin pour permettre un déclenchement manuel.
 */
export async function requireCronOrAdmin(request: Request): Promise<Guard | { user: null }> {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (secret && header === `Bearer ${secret}`) return { user: null };

  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (user.role !== "admin") return { error: forbidden("admin") };
  return { user };
}

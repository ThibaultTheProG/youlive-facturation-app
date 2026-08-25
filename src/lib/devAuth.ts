import type { User } from "@/lib/auth";

/**
 * Bypass d'authentification réservé au développement.
 *
 * `NEXT_PUBLIC_AUTH_DISABLED` porte le préfixe `NEXT_PUBLIC_` : sa valeur est
 * inlinée dans le bundle client au build et n'importe qui peut la lire. Elle
 * était lue directement dans le middleware, les layouts et l'AuthProvider, si
 * bien qu'une mise à `true` sur l'environnement Vercel de production aurait
 * ouvert toute l'application sans authentification.
 *
 * Tout le code passe désormais par ces deux helpers, qui refusent le bypass dès
 * que `NODE_ENV === "production"`. Point d'entrée unique : ne jamais relire
 * `process.env.NEXT_PUBLIC_AUTH_DISABLED` ailleurs.
 */
export function isAuthDisabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
}

/** Utilisateur fictif injecté quand le bypass de dev est actif. */
export function devUser(): User | null {
  if (!isAuthDisabled()) return null;
  return {
    id: Number(process.env.NEXT_PUBLIC_TEST_USER_ID || 999),
    name: process.env.NEXT_PUBLIC_TEST_USER_NAME || "Utilisateur Test",
    email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL || "test@example.com",
    role:
      (process.env.NEXT_PUBLIC_TEST_USER_ROLE as User["role"]) || "conseiller",
  };
}

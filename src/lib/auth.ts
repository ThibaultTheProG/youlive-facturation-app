import { SignJWT, jwtVerify } from "jose";

// Définir les types
export interface JWTPayload {
  id: number;
  role: "admin" | "conseiller";
  name: string;
  email: string;
}

export type User = JWTPayload;

// Définir la clé secrète utilisée pour signer et vérifier les tokens
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

// Générer un token JWT
export async function generateToken(user: JWTPayload): Promise<string> {
  return new SignJWT({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h") // Durée de validité du token
    .sign(SECRET_KEY); // Clé secrète pour signer le token
}

/**
 * Valide la forme du payload décodé.
 *
 * `jwtVerify` garantit la signature et l'expiration, rien de plus : le payload
 * était auparavant casté en `JWTPayload` sans contrôle, si bien qu'un jeton
 * signé mais mal formé (id absent, rôle inconnu) traversait toutes les gardes
 * et arrivait tel quel dans les requêtes Prisma et les comparaisons de rôle.
 */
function estPayloadValide(payload: unknown): payload is JWTPayload {
  if (typeof payload !== "object" || payload === null) return false;

  const { id, role, name, email } = payload as Record<string, unknown>;

  return (
    typeof id === "number" &&
    Number.isInteger(id) &&
    id > 0 &&
    (role === "admin" || role === "conseiller") &&
    typeof name === "string" &&
    typeof email === "string"
  );
}

// Vérifier et décoder un token JWT
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    if (!estPayloadValide(payload)) {
      console.error("Payload de token invalide :", payload);
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return null; // Retourne null si le token est invalide
  }
}

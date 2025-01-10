import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// Définir la clé secrète utilisée pour signer et vérifier les tokens
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET
);

// Générer un token JWT
export async function generateToken(user: { id: number; role: string }): Promise<string> {
  return new SignJWT({ id: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" }) // Algorithme HS256
    .setExpirationTime("1h") // Durée de validité : 1 heure
    .sign(SECRET_KEY); // Signer avec la clé secrète
}

// Vérifier et décoder un token JWT
export async function verifyToken(token: string): Promise<{ id: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY); // Vérification et décodage
    return payload as { id: number; role: string }; // Typage des données décodées
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return null; // Retourner null en cas d'erreur
  }
}

// Hacher un mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10); // Hachage avec un salt de complexité 10
}

// Comparer un mot de passe avec son hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash); // Comparaison du mot de passe et du hash
}
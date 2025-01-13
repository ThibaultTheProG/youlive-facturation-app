import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { User } from "@/lib/types";

// Définir la clé secrète utilisée pour signer et vérifier les tokens
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

// Générer un token JWT
export async function generateToken(user: {
  id: number;
  role: string;
}): Promise<string> {
  return new SignJWT({ id: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" }) // Algorithme HS256
    .setExpirationTime("1h") // Durée de validité : 1 heure
    .sign(SECRET_KEY); // Signer avec la clé secrète
}

// Vérifier et décoder un token JWT
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    const user: User = {
      id: payload.id as number,
      role: payload.role as "admin" | "conseiller",
      name: (payload.name as string) || "Nom par défaut", // Remplacez par une valeur par défaut
      email: (payload.email as string) || "email@example.com", // Remplacez par une valeur par défaut
    };

    return user;
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return null;
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

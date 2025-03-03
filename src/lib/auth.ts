import { SignJWT, jwtVerify } from "jose";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";

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

// Vérifier et décoder un token JWT
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY) as { payload: JWTPayload };

    console.log("Payload décodé :", payload);

    return payload;
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return null; // Retourne null si le token est invalide
  }
}

// Hacher un mot de passe
export async function hashPassword(password: string): Promise<string> {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt)
  return hash;
}

// Comparer un mot de passe avec son hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compareSync(password, hash);
}

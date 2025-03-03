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

// Vérifier et décoder un token JWT
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY) as { payload: JWTPayload };
    return payload;
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return null; // Retourne null si le token est invalide
  }
}

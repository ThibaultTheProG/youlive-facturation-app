import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {

  if (process.env.AUTH_DISABLED === "true") {
    console.log("Auth désactivée : accès direct.");
    return NextResponse.next();
  }
  
  const token = request.cookies.get("authToken")?.value;

  //console.log("Token reçu dans le middleware :", token);

  // Si aucun token, redirigez vers /login
  if (!token) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Vérifiez le token
  const user = await verifyToken(token);

  //console.log("Utilisateur détecté dans le middleware :", user);

  // Si le token est invalide ou l'utilisateur est null, redirigez vers /login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Gérer les permissions basées sur le rôle
  if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    request.nextUrl.pathname.startsWith("/conseiller") &&
    user.role !== "conseiller"
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Autoriser l'accès
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/conseiller/:path*", "/login"], // Appliquez le middleware uniquement sur ces chemins
};
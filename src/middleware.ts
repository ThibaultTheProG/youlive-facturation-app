import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { config } from '../middleware.config.mjs';

export { config };

export async function middleware(request: NextRequest) {
  // Vérifier si c'est une ressource statique
  const { pathname } = request.nextUrl;
  
  // Ignorer les ressources statiques
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') // Fichiers avec extension (js, css, etc.)
  ) {
    return NextResponse.next();
  }

  const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  if (isAuthDisabled) {
    const response = NextResponse.next();
    response.cookies.delete("authToken");
    return response;
  }

  const token = request.cookies.get("authToken")?.value;

  if (!token) {
    console.log("Pas de token trouvé. Redirection vers /login.");
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifyToken(token);

  if (!user) {
    console.log("Utilisateur non valide. Redirection vers /login.");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    console.log(
      "Utilisateur non autorisé pour /admin. Redirection vers /login."
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    request.nextUrl.pathname.startsWith("/conseiller") &&
    user.role !== "conseiller"
  ) {
    console.log(
      "Utilisateur non autorisé pour /conseiller. Redirection vers /login."
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

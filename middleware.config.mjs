export const config = {
  runtime: 'nodejs',
  matcher: [
    // Appliquer le middleware aux routes d'administration et de conseiller
    "/admin/:path*", 
    "/conseiller/:path*", 
    "/login",
    // Exclure les ressources statiques et les API
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ],
}; 
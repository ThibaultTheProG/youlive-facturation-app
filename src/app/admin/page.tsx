import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default async function AdminPage() {
  if (process.env.AUTH_DISABLED !== "true") {
    // Exécuter la logique d'authentification
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      redirect("/login");
    }

    const user = await verifyToken(token);

    if (!user || user.role !== "admin") {
      redirect("/login");
    }
  }

  return <h1 className="">Bienvenue sur le tableau de bord Admin</h1>;
}

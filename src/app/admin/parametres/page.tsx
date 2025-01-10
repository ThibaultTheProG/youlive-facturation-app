import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import FormParams from "@/components/admin/formParams";

export default async function Parametres() {
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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1>Paramètres des conseillers</h1>
      <FormParams />
    </div>
  );
}

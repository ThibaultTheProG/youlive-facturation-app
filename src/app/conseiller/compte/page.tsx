import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import FormParams from "@/components/conseiller/formParams";
import { User } from "@/lib/types";
import ChangeMDP from "@/components/conseiller/changeMdp";

export default async function monCompte() {
  let user: User | null = null;

  if (process.env.AUTH_DISABLED === "true") {
    // Utilisateur fictif en mode développement
    user = {
      id: 1,
      role: "conseiller",
      name: "Utilisateur Démo",
      email: "demo@example.com",
    };
  } else {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      redirect("/login");
    }

    user = await verifyToken(token);

    if (!user || user.role !== "conseiller") {
      redirect("/login");
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1>Mon compte</h1>
      <div className="space-y-8">
        <FormParams user={user} />
        <ChangeMDP />
      </div>
    </div>
  );
}

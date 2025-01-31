import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import FormInscription from "@/components/admin/formInscription";

export default async function AssignPasswordPage() {
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
    <>
      <FormInscription />
    </>
  );
}

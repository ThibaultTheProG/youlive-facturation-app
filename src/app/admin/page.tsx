import { redirect } from "next/navigation";

export default async function AdminPage() {

  redirect("/admin/parametres")

  return (
    <h1>Page Admin</h1>
  );
}

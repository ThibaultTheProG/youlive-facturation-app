import { getConseillersBDD } from "@/backend/gestionConseillers";
import FormParams from "@/components/admin/formParams";

export default async function Parametres() {
  const conseilllersBDD = await getConseillersBDD();
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1>Paramètres des conseillers</h1>
      <FormParams conseillers={conseilllersBDD} />
    </div>
  );
}

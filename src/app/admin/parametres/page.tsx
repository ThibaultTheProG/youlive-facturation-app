import FormParams from "@/components/admin/formParams";

export default async function Parametres() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1>Paramètres des conseillers</h1>
      <FormParams />
    </div>
  );
}

import FormInscription from "@/app/admin/inscription/formInscription";
import { KeyRound } from "lucide-react";

export default async function AssignPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#fef3e8" }}>
            <KeyRound className="w-5 h-5" style={{ color: "#E07C24" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assigner un mot de passe</h1>
            <p className="text-sm text-gray-500 mt-0.5">Créez un accès à l&apos;application pour un conseiller</p>
          </div>
        </div>
        <FormInscription />
      </div>
    </div>
  );
}

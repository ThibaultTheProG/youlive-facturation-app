import { useState } from "react";
import { Button } from "@/components/ui/button";
import InputCustom from "@/components/uiCustom/inputCustom";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function Popin({
  factureId,
  n,
  date,
  onClose,
}: {
  factureId: number;
  n: string;
  date: string;
  onClose: () => void;
}) {
  const [numero, setNumero] = useState(n ?? "");
  const [dateCreation, setDateCreation] = useState<Date | null>(
    date ? new Date(date) : null // 🔹 Convertir `string` en `Date`
  );

  console.log(dateCreation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          created_at: dateCreation?.toISOString(),
        }), // 🔹 Convertir `Date` en `string` ISO
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la facture");
      }

      onClose();
      window.open(`/factures/${factureId}/pdf`, "_blank");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <span className="text-lg font-semibold mb-4">Informations à renseigner</span>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4 mt-4">
            {/* Champ Numéro */}
            <InputCustom
              disable={false}
              name="numero"
              label="Numéro de la facture"
              id="numero"
              type="text"
              value={numero}
              onChange={(val) => setNumero(String(val))}
            />

            {/* Sélecteur de date */}
            <div className="flex flex-col sapce-y-8">
              <span className="text-sm">
                Selectionner une date pour votre facture :
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {dateCreation
                      ? dateCreation.toLocaleDateString()
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white">
                  <Calendar
                    mode="single"
                    selected={dateCreation || undefined}
                    onSelect={(date) => setDateCreation(date ?? null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                className="bg-gray-300 mr-2 cursor-pointer"
                type="button"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button className="bg-orange-strong cursor-pointer" type="submit">
                Valider
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

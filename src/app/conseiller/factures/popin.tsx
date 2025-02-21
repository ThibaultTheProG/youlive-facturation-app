import { useState } from "react";
import { Button } from "@/components/ui/button";
import InputCustom from "@/components/uiCustom/inputCustom";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Label } from "@/components/ui/label";

export default function Popin({
  factureId,
  n,
  date,
  actionType,
  a,
  amount,
  onClose,
  onValidate, // Ajout de la prop pour valider l'envoi de la facture
}: {
  factureId: number;
  n: string;
  date: string;
  actionType: string | null;
  a: string;
  amount: number;
  onClose: () => void;
  onValidate: () => void;
}) {
  const [numero, setNumero] = useState(n ?? "");
  const [dateCreation, setDateCreation] = useState<Date | null>(
    date ? new Date(date) : null
  );
  const [apporteur, setApporteur] = useState<string>(a ?? "non");
  const [apporteurAmount, setApporteurAmount] = useState<number>(amount ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero,
          created_at: dateCreation?.toISOString(),
          apporteur,
          apporteur_amount: apporteurAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la facture");
      }

      if (actionType === "envoyer") {
        onValidate(); // Déclenche l'envoi de la facture
      } else {
        window.open(`/factures/${factureId}/pdf`, "_blank");
      }

      onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <span className="text-lg font-semibold mb-4">
          {actionType === "voir"
            ? "Informations à renseigner"
            : "Envoyer la facture"}
        </span>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-2 mt-4">
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
                Sélectionner une date pour votre facture :
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
                  <DayPicker
                    mode="single"
                    selected={dateCreation || undefined}
                    onSelect={(date) => setDateCreation(date ?? null)}
                    footer={
                      dateCreation
                        ? `Sélectionné: ${dateCreation?.toLocaleDateString()}`
                        : "Sélectionnez une date."
                    }
                    classNames={{
                      month: `p-4`,
                      footer: `p-2`,
                      chevron: `fill-orange-strong`,
                      selected: `bg-orange-strong rounded-md`,
                    }}
                    startMonth={new Date(currentYear, 0)}
                    endMonth={new Date(currentYear, 11)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Apporteur */}
            <div className="flex flex-col space-y-2">
              <span className="text-sm">{"Apporteur d'affaire ?"}</span>
              <RadioGroup value={apporteur} onValueChange={setApporteur}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oui" />
                  <Label htmlFor="oui">Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" />
                  <Label htmlFor="non">Non</Label>
                </div>
              </RadioGroup>
            </div>

            {apporteur === "oui" && (
              <div>
                <InputCustom
                  disable={false}
                  name="apporteur_amount"
                  label="Montant de l'apporteur"
                  id="apporteur_amount"
                type="number"
                value={apporteurAmount}
                  onChange={(val) => setApporteurAmount(Number(val))}
                />
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                className="bg-gray-300 mr-2 cursor-pointer"
                type="button"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button className="bg-orange-strong cursor-pointer" type="submit">
                {actionType === "voir" ? "Valider" : "Envoyer"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

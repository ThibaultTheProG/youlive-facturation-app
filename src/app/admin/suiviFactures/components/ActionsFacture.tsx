"use client";

import { useState } from "react";
import { CircleCheck, Eye, FilePenLine, MoreHorizontal, Percent, Undo2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FactureDetaillee } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ActionsFactureProps {
  facture: FactureDetaillee;
  updateStatut: (factureId: number, newStatut: string, numero: string, created_at: string) => Promise<void>;
  onEditTva: (facture: FactureDetaillee) => void;
  onRemplacer: (facture: FactureDetaillee) => void;
  onAnnulerAvoir: (facture: FactureDetaillee) => void;
  /** Mobile : boutons avec libellé plutôt que des icônes seules. */
  avecLibelles?: boolean;
}

const BOUTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E07C24]/60";

function BoutonIcone({
  libelle,
  icone: Icone,
  onClick,
  ton = "neutre",
  avecLibelle,
}: {
  libelle: string;
  icone: typeof Eye;
  onClick: () => void;
  ton?: "neutre" | "succes";
  avecLibelle?: boolean;
}) {
  const couleur =
    ton === "succes"
      ? "text-emerald-700 hover:bg-emerald-50"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900";
  if (avecLibelle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(BOUTON, "h-11 flex-1 border border-gray-200 px-3", ton === "succes" ? "text-emerald-700" : "text-gray-700")}
      >
        <Icone className="h-4 w-4" />
        {libelle}
      </button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={libelle} onClick={onClick} className={cn(BOUTON, "h-9 w-9", couleur)}>
          <Icone className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{libelle}</TooltipContent>
    </Tooltip>
  );
}

export function ActionsFacture({
  facture,
  updateStatut,
  onEditTva,
  onRemplacer,
  onAnnulerAvoir,
  avecLibelles = false,
}: ActionsFactureProps) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Même règle que /api/factures/[id]/remplacer et /annuler : un document
  // envoyé ou payé a été émis, il ne s'annule plus sans contre-écriture.
  const jamaisEmise = facture.statut_envoi !== "envoyée" && facture.statut_paiement !== "payé";
  const remplacable = (facture.type === "commission" || facture.type === "recrutement") && jamaisEmise;
  const avoirAnnulable = facture.type === "avoir" && jamaisEmise;
  const estPaye = facture.statut_paiement === "payé";

  const voirPdf = () => window.open(`/factures/${facture.id}/pdf`, "_blank");

  // Une facture annulée n'a plus qu'un PDF à consulter.
  if (facture.annulee) {
    return (
      <div className="flex items-center justify-end gap-1">
        <BoutonIcone libelle="Voir le PDF" icone={Eye} onClick={voirPdf} avecLibelle={avecLibelles} />
      </div>
    );
  }

  const elementsMenu = [
    { libelle: "Modifier la TVA", icone: Percent, action: () => onEditTva(facture), visible: true },
    { libelle: "Annuler et remplacer", icone: FilePenLine, action: () => onRemplacer(facture), visible: remplacable },
    {
      libelle: Number(facture.retrocession) < 0 ? "Annuler l'avoir" : "Annuler l'ajustement",
      icone: Undo2,
      action: () => onAnnulerAvoir(facture),
      visible: avoirAnnulable,
    },
  ].filter((e) => e.visible);

  return (
    <div className={cn("flex items-center gap-1", avecLibelles ? "w-full" : "justify-end")}>
      <BoutonIcone
        libelle={estPaye ? "Repasser en non payée" : "Marquer comme payée"}
        icone={estPaye ? Undo2 : CircleCheck}
        ton={estPaye ? "neutre" : "succes"}
        avecLibelle={avecLibelles}
        onClick={() =>
          updateStatut(facture.id, estPaye ? "non payé" : "payé", facture.numero, facture.created_at)
        }
      />
      <BoutonIcone libelle="Voir le PDF" icone={Eye} onClick={voirPdf} avecLibelle={avecLibelles} />

      <Popover open={menuOuvert} onOpenChange={setMenuOuvert}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Autres actions"
                className={cn(
                  BOUTON,
                  avecLibelles ? "h-11 w-11 border border-gray-200 text-gray-700" : "h-9 w-9 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Autres actions</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-56 p-1">
          {elementsMenu.map(({ libelle, icone: Icone, action }) => (
            <button
              key={libelle}
              type="button"
              onClick={() => {
                setMenuOuvert(false);
                action();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus-visible:bg-gray-100"
            >
              <Icone className="h-4 w-4 text-gray-400" />
              {libelle}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

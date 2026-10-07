"use client";

import { Loader2, Mail, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SYNCHRONISATIONS,
  type DefinitionSync,
  type PassageSync,
  type TypeSync,
} from "@/lib/synchronisations";
import { BadgeStatut, formaterDate, formaterDuree, origine } from "./affichage";

interface CartesSyncProps {
  derniers: Partial<Record<TypeSync, PassageSync | null>>;
  /** Types en cours d'exécution, lancés d'ici ou vus dans le journal. */
  enCours: Set<TypeSync>;
  /** Un enchaînement complet est en cours : aucun lancement unitaire. */
  chaineEnCours: boolean;
  onLancer: (definition: DefinitionSync) => void;
}

export default function CartesSync({
  derniers,
  enCours,
  chaineEnCours,
  onLancer,
}: CartesSyncProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {SYNCHRONISATIONS.map((definition, index) => {
        const dernier = derniers[definition.type] ?? null;
        const tourne = enCours.has(definition.type);

        return (
          <div
            key={definition.type}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#fef3e8", color: "#E07C24" }}
              >
                {index + 1}
              </span>
              <h3 className="font-semibold text-gray-900">{definition.libelle}</h3>
              {definition.emails && (
                <span title={definition.emails}>
                  <Mail className="h-4 w-4 text-gray-400" aria-label="Envoie des emails" />
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-500">{definition.description}</p>

            <div className="mt-4 flex-grow text-sm">
              {tourne ? (
                <BadgeStatut statut="en_cours" />
              ) : dernier ? (
                <div className="space-y-1">
                  <BadgeStatut statut={dernier.statut} />
                  <p className="text-gray-600">
                    {formaterDate(dernier.debut)}
                    {dernier.duree_ms !== null && ` · ${formaterDuree(dernier.duree_ms)}`}
                  </p>
                  <p className="text-xs text-gray-400">{origine(dernier)}</p>
                </div>
              ) : (
                <p className="text-gray-400">Aucun passage enregistré</p>
              )}
            </div>

            <Button
              onClick={() => onLancer(definition)}
              disabled={tourne || chaineEnCours}
              variant="outline"
              className="mt-4 cursor-pointer"
            >
              {tourne ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {tourne ? "En cours…" : "Lancer"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

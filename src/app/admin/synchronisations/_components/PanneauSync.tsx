"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SYNCHRONISATIONS,
  type DefinitionSync,
  type JournalSyncReponse,
  type TypeSync,
} from "@/lib/synchronisations";
import CartesSync from "./CartesSync";
import HistoriqueSync from "./HistoriqueSync";

const fetcher = async (url: string): Promise<JournalSyncReponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur lors de la lecture du journal");
  return response.json();
};

/** Ce que l'admin s'apprête à lancer : une synchronisation, ou toute la chaîne. */
type Demande = { definition: DefinitionSync } | { chaine: true };

export default function PanneauSync() {
  const [page, setPage] = useState(1);
  const [filtreType, setFiltreType] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [lancees, setLancees] = useState<Set<TypeSync>>(new Set());
  const [chaineEnCours, setChaineEnCours] = useState(false);
  const [demande, setDemande] = useState<Demande | null>(null);

  const cle = `/api/synchronisations?${new URLSearchParams({
    page: String(page),
    type: filtreType,
    statut: filtreStatut,
  })}`;

  // Le journal fait foi : une sync lancée par le cron, ou depuis un autre
  // onglet, apparaît en cours ici aussi. On le relit vite tant que ça tourne.
  const { data, error, isLoading, mutate } = useSWR(cle, fetcher, {
    keepPreviousData: true,
    refreshInterval: (derniere) =>
      lancees.size > 0 ||
      Object.values(derniere?.derniers ?? {}).some((p) => p?.statut === "en_cours")
        ? 3000
        : 30000,
  });

  const enCours = useMemo(() => {
    const types = new Set(lancees);
    for (const { type } of SYNCHRONISATIONS) {
      if (data?.derniers?.[type]?.statut === "en_cours") types.add(type);
    }
    return types;
  }, [lancees, data]);

  /** Lance une synchronisation et attend sa réponse. Rend `true` si elle a abouti. */
  const lancer = async (definition: DefinitionSync): Promise<boolean> => {
    setLancees((actuelles) => new Set(actuelles).add(definition.type));
    void mutate();
    try {
      const response = await fetch(definition.route);
      const corps = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(corps.error || `Erreur HTTP ${response.status}`);
      }
      if (Number(corps.erreurs) > 0) {
        toast.error(
          `${definition.libelle} : terminée avec ${corps.erreurs} erreur(s), voir l'historique.`
        );
      } else {
        toast.success(`${definition.libelle} : synchronisation terminée.`);
      }
      return true;
    } catch (e) {
      toast.error(
        `${definition.libelle} : ${e instanceof Error ? e.message : String(e)}`
      );
      return false;
    } finally {
      setLancees((actuelles) => {
        const suivantes = new Set(actuelles);
        suivantes.delete(definition.type);
        return suivantes;
      });
      void mutate();
    }
  };

  // Dans l'ordre de la chaîne nocturne, en s'arrêtant au premier échec : les
  // factures ne doivent pas être générées sur des contrats mal importés.
  const lancerChaine = async () => {
    setChaineEnCours(true);
    try {
      for (const definition of SYNCHRONISATIONS) {
        const abouti = await lancer(definition);
        if (!abouti) {
          toast.error("Enchaînement arrêté : les étapes suivantes n'ont pas été lancées.");
          return;
        }
      }
    } finally {
      setChaineEnCours(false);
    }
  };

  const demander = (definition: DefinitionSync) => {
    if (definition.emails) setDemande({ definition });
    else void lancer(definition);
  };

  const confirmer = () => {
    if (!demande) return;
    if ("chaine" in demande) void lancerChaine();
    else void lancer(demande.definition);
    setDemande(null);
  };

  const avertissements =
    demande && "chaine" in demande
      ? SYNCHRONISATIONS.filter((s) => s.emails)
      : demande
        ? [demande.definition]
        : [];

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lancer une synchronisation</h2>
            <p className="text-sm text-gray-500">
              Elles tournent chaque nuit, dans cet ordre, à partir de 2 h. Chaque étape
              s&apos;appuie sur les précédentes.
            </p>
          </div>
          <Button
            onClick={() => setDemande({ chaine: true })}
            disabled={chaineEnCours || enCours.size > 0}
            className="bg-orange-strong text-white hover:bg-orange-light hover:text-black cursor-pointer"
          >
            {chaineEnCours ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Tout synchroniser
          </Button>
        </div>
        <CartesSync
          derniers={data?.derniers ?? {}}
          enCours={enCours}
          chaineEnCours={chaineEnCours}
          onLancer={demander}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique</h2>
        {error && !data ? (
          <p className="text-sm text-red-600">
            L&apos;historique n&apos;a pas pu être chargé.
          </p>
        ) : (
          <HistoriqueSync
            lignes={data?.lignes ?? []}
            chargement={isLoading && !data}
            page={page}
            pages={data?.pages ?? 1}
            onPage={setPage}
            filtreType={filtreType}
            onFiltreType={(type) => {
              setFiltreType(type);
              setPage(1);
            }}
            filtreStatut={filtreStatut}
            onFiltreStatut={(statut) => {
              setFiltreStatut(statut);
              setPage(1);
            }}
          />
        )}
      </section>

      <Dialog open={demande !== null} onOpenChange={(ouvert) => !ouvert && setDemande(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {demande && "chaine" in demande
                ? "Lancer toutes les synchronisations"
                : `Lancer la synchronisation « ${
                    demande ? demande.definition.libelle : ""
                  } »`}
            </DialogTitle>
            <DialogDescription>
              {demande && "chaine" in demande
                ? "Les cinq synchronisations s'enchaînent dans l'ordre et s'arrêtent à la première erreur. Gardez cette page ouverte jusqu'à la fin : la fermer interrompt l'enchaînement après l'étape en cours."
                : "Cette synchronisation peut écrire à des conseillers."}
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-sm text-gray-700 py-2">
            {avertissements.map((definition) => (
              <li key={definition.type}>
                <span className="font-semibold">{definition.libelle}</span> —{" "}
                {definition.emails}
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDemande(null)}>
              Retour
            </Button>
            <Button onClick={confirmer}>Lancer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useCallback } from "react";
import { User, Facture } from "@/lib/types";
import { getFactures } from "@/backend/gestionFactures";
import Popin from "./popin";
import {
  Eye,
  FileSearch,
  HandCoins,
  Receipt,
  Search,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EnTeteTriable, ENTETE_COLONNE } from "@/components/uiCustom/enTeteTriable";
import { TuileStat } from "@/components/uiCustom/tuileStat";
import { PiedPagination } from "@/components/uiCustom/piedPagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PastilleEnvoi, PastillePaiement, PastilleType } from "./pastilles";

const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
const formatEuros = (valeur: string | number | undefined) =>
  EUROS.format(Number(valeur ?? 0));

/** Pourquoi l'envoi est impossible, ou null s'il est possible. */
function raisonEnvoiImpossible(f: Facture): string | null {
  if (f.statut_paiement === "payé") return "Facture déjà payée";
  if (f.statut_envoi === "envoyée") return "Facture déjà envoyée";
  if (!f.numero)
    return "Numéro de facture manquant : il doit d'abord être attribué";
  return null;
}

function BoutonIcone({
  libelle,
  onClick,
  icone: Icone,
  desactive = false,
  accent = false,
}: {
  libelle: string;
  onClick: () => void;
  icone: typeof Eye;
  desactive?: boolean;
  accent?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Un bouton désactivé ne reçoit pas le survol : le span porte l'infobulle. */}
        <span className="inline-flex">
          <button
            type="button"
            onClick={onClick}
            disabled={desactive}
            aria-label={libelle}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
              desactive
                ? "cursor-not-allowed text-gray-300"
                : accent
                  ? "cursor-pointer bg-[#E07C24] text-white hover:bg-[#c96a17]"
                  : "cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icone className="h-4 w-4" />
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{libelle}</TooltipContent>
    </Tooltip>
  );
}

export default function TableauFactures({ user }: { user: User }) {
  const [facturesList, setFacturesList] = useState<Facture[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [actionType, setActionType] = useState<"voir" | "envoyer" | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const [dateFilter, setDateFilter] = useState<string>("tous");
  const [mandatSearch, setMandatSearch] = useState<string>("");

  // États pour le tri
  const [sortField, setSortField] = useState<string | null>("date_signature");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const itemsPerPage = 10;

  // Fonction pour gérer le tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Même champ : inverser la direction
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
    } else {
      // Nouveau champ : réinitialiser à asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Fonction pour charger les factures
  const loadFactures = useCallback(() => {
    getFactures(user.id)
      .then((factures) => {
        const facturesTriees = factures
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((facture: any) => {
            const factureFormatted = {
              ...facture,
              date_signature:
                facture.date_signature || new Date().toISOString(),
              numero_mandat: facture.numero_mandat,
              vat_rate: 0,
              created_at: facture.created_at
                ? new Date(facture.created_at).toISOString()
                : null,
              added_at: facture.added_at
                ? new Date(facture.added_at).toISOString()
                : null,
            };
            return factureFormatted as unknown as Facture;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => {
            // Trier selon le champ et la direction sélectionnés
            let comparison = 0;

            if (sortField === "date_signature") {
              const dateA = a.date_signature
                ? new Date(a.date_signature).getTime()
                : 0;
              const dateB = b.date_signature
                ? new Date(b.date_signature).getTime()
                : 0;
              comparison = dateA - dateB;
            } else if (sortField === "montant") {
              const montantA = parseFloat(a.retrocession) || 0;
              const montantB = parseFloat(b.retrocession) || 0;
              comparison = montantA - montantB;
            } else if (sortField === "numero") {
              const numeroA = a.numero || "";
              const numeroB = b.numero || "";
              comparison = numeroA.localeCompare(numeroB);
            } else if (sortField === "type") {
              const typeA = a.type || "";
              const typeB = b.type || "";
              comparison = typeA.localeCompare(typeB);
            }

            // Appliquer la direction de tri
            return sortDirection === "asc" ? comparison : -comparison;
          });
        setFacturesList(facturesTriees);
      })
      .catch((error) =>
        console.error("Impossible de récupérer les factures :", error),
      );
  }, [user.id, sortField, sortDirection]);

  // Calcul des totaux des rétrocessions par type
  const totalRetrocessionCommission = facturesList
    ? facturesList
        .filter((facture) => facture.type === "commission")
        .reduce((total, facture) => total + parseFloat(facture.retrocession), 0)
    : 0;

  const totalRetrocessionRecrutement = facturesList
    ? facturesList
        .filter((facture) => facture.type === "recrutement")
        .reduce((total, facture) => total + parseFloat(facture.retrocession), 0)
    : 0;

  const totalAvoir = facturesList
    ? facturesList
        .filter((facture) => facture.type === "avoir")
        .reduce((total, facture) => total + parseFloat(facture.retrocession), 0)
    : 0;

  // Filtrer les factures par type, date et numéro de mandat
  const filteredFactures = facturesList
    ? facturesList.filter((facture) => {
        // Filtre par type
        if (typeFilter !== "tous" && facture.type !== typeFilter) {
          return false;
        }

        // Filtre par numéro de mandat
        if (mandatSearch.trim() !== "") {
          const search = mandatSearch.trim().toLowerCase();
          const mandat = (facture.numero_mandat || "").toString().toLowerCase();
          if (!mandat.includes(search)) return false;
        }

        // Filtre par date de signature
        if (dateFilter !== "tous") {
          const factureDate = facture.date_signature
            ? new Date(facture.date_signature)
            : null;
          if (!factureDate) return false;

          const today = new Date();

          switch (dateFilter) {
            case "aujourd_hui":
              return factureDate.toDateString() === today.toDateString();
            case "cette_semaine":
              const weekAgo = new Date(
                today.getTime() - 7 * 24 * 60 * 60 * 1000,
              );
              return factureDate >= weekAgo;
            case "ce_mois":
              return (
                factureDate.getMonth() === today.getMonth() &&
                factureDate.getFullYear() === today.getFullYear()
              );
            case "ce_trimestre":
              const quarterStart = new Date(
                today.getFullYear(),
                Math.floor(today.getMonth() / 3) * 3,
                1,
              );
              return factureDate >= quarterStart;
            case "cette_annee":
              return factureDate.getFullYear() === today.getFullYear();
            default:
              return true;
          }
        }

        return true;
      })
    : null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  let currentItems;
  let totalPages;
  if (filteredFactures) {
    currentItems = filteredFactures.slice(indexOfFirstItem, indexOfLastItem);
    totalPages = Math.max(1, Math.ceil(filteredFactures.length / itemsPerPage));
  }

  // Tout changement de filtre ramène à la première page. Fait dans les
  // handlers plutôt que dans un effet, pour éviter un rendu intermédiaire
  // affichant la nouvelle liste sur l'ancien numéro de page.
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleMandatSearchChange = (value: string) => {
    setMandatSearch(value);
    setCurrentPage(1);
  };

  const filtresActifs =
    typeFilter !== "tous" ||
    dateFilter !== "tous" ||
    mandatSearch.trim() !== "";
  const reinitialiserFiltres = () => {
    setTypeFilter("tous");
    setDateFilter("tous");
    setMandatSearch("");
    setCurrentPage(1);
  };

  const ouvrir = (facture: Facture, action: "voir" | "envoyer") => {
    setSelectedFacture(facture);
    setActionType(action);
  };

  // Charger les factures au montage du composant et quand le tri change
  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  const sendFacture = async (factureId: number) => {
    const toastId = toast.loading("Envoi de la facture en cours...");
    try {
      const response = await fetch("/api/factures/send", {
        method: "POST",
        body: JSON.stringify({ factureId }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Facture envoyée avec succès !", { id: toastId });
        loadFactures();
      } else {
        toast.error(`Erreur : ${data.error}`, { id: toastId });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la facture :", error);
      toast.error("Erreur lors de l'envoi de la facture.", { id: toastId });
    }
  };

  const total = filteredFactures?.length ?? 0;
  const debut = total === 0 ? 0 : indexOfFirstItem + 1;
  const fin = Math.min(indexOfLastItem, total);
  const trie = {
    currentSortField: sortField,
    currentSortDirection: sortDirection,
    onSort: handleSort,
  };

  const message = mandatSearch.trim()
    ? `Aucune facture avec le n° de mandat « ${mandatSearch.trim()} ».`
    : filtresActifs
      ? "Aucune facture ne correspond à ces filtres."
      : "Vous n'avez encore aucune facture.";

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TuileStat
          icone={HandCoins}
          titre="Rétrocessions · Commission"
          valeur={EUROS.format(totalRetrocessionCommission)}
        />
        <TuileStat
          icone={Receipt}
          titre="Rétrocessions · Recrutement"
          valeur={EUROS.format(totalRetrocessionRecrutement)}
        />
        {totalAvoir !== 0 && (
          <TuileStat
            icone={Undo2}
            titre="Avoirs / ajustements"
            valeur={EUROS.format(totalAvoir)}
          />
        )}
      </div>

      <div className="overflow-clip rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 p-4 md:p-5">
          <div className="min-w-[14rem] flex-1 md:max-w-sm">
            <label
              htmlFor="mandatSearch"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              N° de mandat
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="mandatSearch"
                type="search"
                value={mandatSearch}
                onChange={(e) => handleMandatSearchChange(e.target.value)}
                placeholder="Ex : 12345"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="typeFilter"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Type
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              <option value="tous">Tous les types</option>
              <option value="commission">Commission</option>
              <option value="recrutement">Recrutement</option>
              <option value="avoir">Avoir / Ajustement</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dateFilter"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Date de signature
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              <option value="tous">Toutes les dates</option>
              <option value="aujourd_hui">Aujourd&apos;hui</option>
              <option value="cette_semaine">Cette semaine</option>
              <option value="ce_mois">Ce mois</option>
              <option value="ce_trimestre">Ce trimestre</option>
              <option value="cette_annee">Cette année</option>
            </select>
          </div>
          {filtresActifs && (
            <button
              type="button"
              onClick={reinitialiserFiltres}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Mobile : une carte par facture */}
        <ul className="divide-y divide-gray-100 md:hidden">
          {currentItems === undefined &&
            [0, 1, 2].map((i) => (
              <li key={i} className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </li>
            ))}
          {currentItems?.map((facture) => {
            const raison = raisonEnvoiImpossible(facture);
            return (
              <li key={facture.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <PastilleType facture={facture} />
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {facture.numero || "Numéro à attribuer"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mandat {facture.numero_mandat || "N/A"} · signé le{" "}
                      {formatDate(facture.date_signature)}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold tabular-nums text-gray-900">
                    {formatEuros(facture.retrocession)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PastillePaiement statut={facture.statut_paiement} />
                  <PastilleEnvoi statut={facture.statut_envoi} />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => ouvrir(facture, "voir")}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
                  >
                    <Eye className="h-4 w-4" /> Voir le PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => ouvrir(facture, "envoyer")}
                    disabled={raison !== null}
                    title={raison ?? undefined}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                      raison
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "cursor-pointer bg-[#E07C24] text-white hover:bg-[#c96a17]",
                    )}
                  >
                    <Send className="h-4 w-4" />{" "}
                    {raison ? "Indisponible" : "Envoyer"}
                  </button>
                </div>
                {raison && <p className="text-xs text-gray-400">{raison}</p>}
              </li>
            );
          })}
          {currentItems && currentItems.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <FileSearch className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">{message}</p>
            </li>
          )}
        </ul>

        {/* Écrans larges : tableau */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <EnTeteTriable title="Numéro" field="numero" {...trie} />
                <EnTeteTriable title="Type" field="type" {...trie} />
                <TableHead className={ENTETE_COLONNE}>Mandat</TableHead>
                <EnTeteTriable
                  title="Signature"
                  field="date_signature"
                  {...trie}
                />
                <TableHead className={cn(ENTETE_COLONNE, "text-right")}>
                  Honoraires HT
                </TableHead>
                <TableHead className={cn(ENTETE_COLONNE, "text-right")}>Taux</TableHead>
                <EnTeteTriable
                  title="Rétrocession HT"
                  field="montant"
                  align="right"
                  {...trie}
                />
                <TableHead className={ENTETE_COLONNE}>Statut</TableHead>
                <TableHead className={cn(ENTETE_COLONNE, "hidden xl:table-cell")}>
                  Paiement
                </TableHead>
                <TableHead className={cn(ENTETE_COLONNE, "hidden 2xl:table-cell")}>
                  Ajoutée le
                </TableHead>
                <TableHead className={cn(ENTETE_COLONNE, "text-right")}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems === undefined &&
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={11} className="px-3 py-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {currentItems?.map((facture) => {
                const raison = raisonEnvoiImpossible(facture);
                return (
                  <TableRow key={facture.id} className="hover:bg-gray-50/60">
                    <TableCell className="px-3 py-3 font-medium text-gray-900">
                      {facture.numero || (
                        <span className="font-normal text-gray-400">
                          À attribuer
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <PastilleType facture={facture} />
                      {facture.type === "commission" && facture.tranche && (
                        <span className="ml-1.5 whitespace-nowrap text-xs text-gray-400">
                          {facture.tranche.replace("_", " ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-600">
                      {facture.numero_mandat || "N/A"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-600">
                      {formatDate(facture.date_signature)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums text-gray-600">
                      {formatEuros(
                        facture.montant_honoraires ?? facture.honoraires_agent,
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums text-gray-600">
                      {facture.taux_retrocession !== undefined
                        ? `${facture.taux_retrocession} %`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {formatEuros(facture.retrocession)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <PastillePaiement statut={facture.statut_paiement} />
                        <PastilleEnvoi statut={facture.statut_envoi} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-3 text-gray-600 xl:table-cell">
                      {formatDate(facture.date_paiement)}
                    </TableCell>
                    <TableCell className="hidden px-3 py-3 text-gray-600 2xl:table-cell">
                      {formatDate(facture.added_at)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <BoutonIcone
                          libelle="Voir le PDF"
                          icone={Eye}
                          onClick={() => ouvrir(facture, "voir")}
                        />
                        <BoutonIcone
                          libelle={raison ?? "Envoyer la facture"}
                          icone={Send}
                          accent
                          desactive={raison !== null}
                          onClick={() => ouvrir(facture, "envoyer")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {currentItems && currentItems.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={11} className="py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FileSearch className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">{message}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <PiedPagination
          debut={debut}
          fin={fin}
          total={total}
          element="facture"
          page={currentPage}
          totalPages={totalPages ?? 1}
          onPrecedent={() => setCurrentPage((prev) => prev - 1)}
          onSuivant={() => setCurrentPage((prev) => prev + 1)}
        />
      </div>

      {selectedFacture && (
        <Popin
          factureId={selectedFacture.id}
          n={selectedFacture.numero}
          date={selectedFacture.created_at}
          a={selectedFacture.apporteur}
          amount={selectedFacture.apporteur_amount}
          actionType={actionType}
          onValidate={() => {
            if (actionType === "envoyer") {
              sendFacture(selectedFacture.id);
            }
            setSelectedFacture(null);
            setActionType(null);
          }}
          onClose={() => {
            setSelectedFacture(null);
            setActionType(null);
          }}
        />
      )}
    </>
  );
}

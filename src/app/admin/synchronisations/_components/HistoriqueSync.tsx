"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/app/admin/suiviFactures/components/Pagination";
import {
  LIBELLES_STATUT,
  SYNCHRONISATIONS,
  definitionSync,
  detailResume,
  phraseResume,
  type PassageSync,
  type StatutSync,
} from "@/lib/synchronisations";
import {
  BadgeStatut,
  explicationErreur,
  formaterDate,
  formaterDuree,
  origine,
} from "./affichage";

const TOUS = "tous";

interface HistoriqueSyncProps {
  lignes: PassageSync[];
  chargement: boolean;
  page: number;
  pages: number;
  onPage: (page: number) => void;
  filtreType: string;
  onFiltreType: (type: string) => void;
  filtreStatut: string;
  onFiltreStatut: (statut: string) => void;
}

export default function HistoriqueSync({
  lignes,
  chargement,
  page,
  pages,
  onPage,
  filtreType,
  onFiltreType,
  filtreStatut,
  onFiltreStatut,
}: HistoriqueSyncProps) {
  const [deplie, setDeplie] = useState<number | null>(null);

  return (
    <div>
      <div className="grid gap-4 mb-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filtre-sync-type">Synchronisation</Label>
          <Select
            value={filtreType || TOUS}
            onValueChange={(valeur) => onFiltreType(valeur === TOUS ? "" : valeur)}
          >
            <SelectTrigger id="filtre-sync-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={TOUS}>Toutes</SelectItem>
              {SYNCHRONISATIONS.map(({ type, libelle }) => (
                <SelectItem key={type} value={type}>
                  {libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filtre-sync-statut">Statut</Label>
          <Select
            value={filtreStatut || TOUS}
            onValueChange={(valeur) => onFiltreStatut(valeur === TOUS ? "" : valeur)}
          >
            <SelectTrigger id="filtre-sync-statut" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={TOUS}>Tous les statuts</SelectItem>
              {(Object.keys(LIBELLES_STATUT) as StatutSync[]).map((statut) => (
                <SelectItem key={statut} value={statut}>
                  {LIBELLES_STATUT[statut]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chargement ? (
        <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement de l&apos;historique…</span>
        </div>
      ) : lignes.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Aucun passage ne correspond à ces critères.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Synchronisation</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Résultat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map((passage) => {
                const ouvert = deplie === passage.id;
                const erreur = explicationErreur(passage);
                const detail = detailResume(passage.type, passage.resume);

                return (
                  <Fragment key={passage.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setDeplie(ouvert ? null : passage.id)}
                    >
                      <TableCell>
                        <button
                          type="button"
                          aria-expanded={ouvert}
                          aria-label={ouvert ? "Masquer le détail" : "Afficher le détail"}
                          className="flex items-center text-gray-400"
                        >
                          {ouvert ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formaterDate(passage.debut)}
                      </TableCell>
                      <TableCell>
                        {definitionSync(passage.type)?.libelle ?? passage.type}
                      </TableCell>
                      <TableCell>{origine(passage)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formaterDuree(passage.duree_ms)}
                      </TableCell>
                      <TableCell>
                        <BadgeStatut statut={passage.statut} />
                      </TableCell>
                      <TableCell className="max-w-md whitespace-normal text-sm text-gray-600">
                        {erreur ? (
                          <span className="text-red-700 line-clamp-2">{erreur}</span>
                        ) : (
                          phraseResume(passage.type, passage.resume)
                        )}
                      </TableCell>
                    </TableRow>

                    {ouvert && (
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableCell />
                        <TableCell colSpan={6} className="whitespace-normal py-4">
                          {erreur && (
                            <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 break-words">
                              {erreur}
                            </p>
                          )}
                          {detail.length > 0 ? (
                            <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                              {detail.map(({ cle, libelle, valeur }) => (
                                <div key={cle} className="flex justify-between gap-4">
                                  <dt className="text-gray-500">{libelle}</dt>
                                  <dd className="font-medium text-gray-900">{valeur}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            !erreur && (
                              <p className="text-sm text-gray-500">
                                {passage.statut === "en_cours"
                                  ? "Synchronisation en cours…"
                                  : "Aucun détail enregistré."}
                              </p>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={pages} onPageChange={onPage} />
    </div>
  );
}

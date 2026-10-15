"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Target, Trophy, UsersRound, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnTeteTriable } from "@/components/uiCustom/enTeteTriable";
import { PiedPagination } from "@/components/uiCustom/piedPagination";
import { TuileStat } from "@/components/uiCustom/tuileStat";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initiales } from "@/utils/initiales";

interface Filleul {
  id: number;
  prenom: string;
  nom: string;
  chiffre_affaires: number;
  niveau: string;
}

/** Au-delà de ce chiffre d'affaires annuel, un filleul ne génère plus d'honoraires de recrutement. */
const SEUIL_CA = 70000;
const LIGNES_PAR_PAGE = 10;
const NIVEAUX = ["Niveau 1", "Niveau 2", "Niveau 3"] as const;

const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Tri = "nom" | "niveau" | "ca";

const nomComplet = (f: Filleul) => `${f.prenom ?? ""} ${f.nom ?? ""}`.trim();

function PastilleNiveau({ niveau }: { niveau: string }) {
  const couleur =
    niveau === "Niveau 1"
      ? "bg-[#fef3e8] text-[#b35a10]"
      : niveau === "Niveau 2"
        ? "bg-sky-50 text-sky-700"
        : "bg-gray-100 text-gray-700";
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        couleur,
      )}
    >
      {niveau}
    </span>
  );
}

/** Chiffre d'affaires plafonné au seuil, avec une jauge : il se lit d'un coup d'œil. */
function JaugeCA({ ca }: { ca: number }) {
  const atteint = ca >= SEUIL_CA;
  const affiche = Math.min(ca, SEUIL_CA);
  const part = Math.max(0, Math.min(100, (affiche / SEUIL_CA) * 100));
  return (
    <div className="min-w-[6.5rem] sm:min-w-[10rem] max-w-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold tabular-nums text-gray-900">
          {EUROS.format(affiche)}
        </span>
        {atteint ? (
          <span className="text-xs font-medium text-emerald-700">
            Seuil atteint
          </span>
        ) : (
          <span className="hidden text-xs tabular-nums text-gray-400 sm:inline">
            sur {EUROS.format(SEUIL_CA)}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SEUIL_CA}
        aria-valuenow={affiche}
        aria-label="Chiffre d'affaires par rapport au seuil de 70 000 €"
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className={cn(
            "h-full rounded-full",
            atteint ? "bg-emerald-500" : "bg-[#E07C24]",
          )}
          style={{ width: `${part}%` }}
        />
      </div>
    </div>
  );
}

export default function TableauFilleuls({ user }: { user: User }) {
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [chargement, setChargement] = useState(true);
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [annees, setAnnees] = useState<number[]>([]);
  const [niveau, setNiveau] = useState<string>("tous");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<Tri>("niveau");
  const [sens, setSens] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const charger = async () => {
      try {
        if (!user?.id) return;
        const response = await fetch(`/api/conseiller/annees?id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAnnees(data.annees || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des années:", error);
      }
    };
    charger();
  }, [user]);

  useEffect(() => {
    const charger = async () => {
      try {
        if (!user?.id) return;
        const anneeCourante = new Date().getFullYear();
        const url =
          annee === anneeCourante
            ? `/api/filleuls?conseillerId=${user.id}`
            : `/api/filleuls?conseillerId=${user.id}&annee=${annee}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error("Erreur lors de la récupération des filleuls");
        setFilleuls(await response.json());
      } catch (error) {
        console.error("❌ Erreur lors du chargement des filleuls :", error);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [user, annee]);

  const changerAnnee = (valeur: number) => {
    setChargement(true);
    setAnnee(valeur);
    setPage(1);
  };

  const trier = (champ: string) => {
    if (tri === champ) {
      setSens((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setTri(champ as Tri);
      setSens("asc");
    }
  };

  const parNiveau = useMemo(
    () =>
      Object.fromEntries(
        NIVEAUX.map((n) => [n, filleuls.filter((f) => f.niveau === n).length]),
      ),
    [filleuls],
  );
  const sousSeuil = filleuls.filter(
    (f) => f.chiffre_affaires < SEUIL_CA,
  ).length;

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const liste = filleuls.filter(
      (f) =>
        (niveau === "tous" || f.niveau === niveau) &&
        (terme === "" || nomComplet(f).toLowerCase().includes(terme)),
    );
    const dir = sens === "asc" ? 1 : -1;
    return [...liste].sort((a, b) => {
      let c = 0;
      if (tri === "ca") c = a.chiffre_affaires - b.chiffre_affaires;
      else if (tri === "nom")
        c = nomComplet(a).localeCompare(nomComplet(b), "fr");
      else
        c =
          a.niveau.localeCompare(b.niveau) ||
          nomComplet(a).localeCompare(nomComplet(b), "fr");
      return c * dir;
    });
  }, [filleuls, niveau, recherche, tri, sens]);

  const totalPages = Math.max(1, Math.ceil(visibles.length / LIGNES_PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const premier = (pageCourante - 1) * LIGNES_PAR_PAGE;
  const lignes = visibles.slice(premier, premier + LIGNES_PAR_PAGE);
  const filtresActifs = niveau !== "tous" || recherche.trim() !== "";
  const trie = {
    currentSortField: tri,
    currentSortDirection: sens,
    onSort: trier,
  };

  const message = filtresActifs
    ? "Aucun filleul ne correspond à ces filtres."
    : `Vous n'avez aucun filleul en ${annee}.`;

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TuileStat
          icone={UsersRound}
          titre="Filleuls parrainés"
          valeur={String(filleuls.length)}
        />
        <TuileStat
          icone={Target}
          titre="Sous le seuil de 70 000 €"
          valeur={String(sousSeuil)}
        />
        <TuileStat
          icone={Trophy}
          titre="Seuil atteint"
          valeur={String(filleuls.length - sousSeuil)}
        />
      </div>

      <div className="overflow-clip rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 p-4 md:p-5">
          <div className="min-w-[14rem] flex-1 md:max-w-sm">
            <label
              htmlFor="rechercheFilleul"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Nom du filleul
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="rechercheFilleul"
                type="search"
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher un filleul"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
              />
            </div>
          </div>

          <div>
            <p
              id="libelleNiveau"
              className="mb-1 text-xs font-medium text-gray-500"
            >
              Ligne de parrainage
            </p>
            <div
              role="group"
              aria-labelledby="libelleNiveau"
              className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1"
            >
              {[
                { id: "tous", label: "Tous", n: filleuls.length },
                ...NIVEAUX.map((n) => ({ id: n, label: n, n: parNiveau[n] })),
              ].map(({ id, label, n }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={niveau === id}
                  onClick={() => {
                    setNiveau(id);
                    setPage(1);
                  }}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E07C24]/60",
                    niveau === id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  {label}{" "}
                  <span className="text-xs tabular-nums text-gray-400">
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="anneeFilleuls"
              className="mb-1 block text-xs font-medium text-gray-500"
            >
              Année
            </label>
            <select
              id="anneeFilleuls"
              value={annee}
              onChange={(e) => changerAnnee(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              {annees.map((a) => (
                <option key={a} value={a}>
                  {a}
                  {a === new Date().getFullYear() ? " (en cours)" : ""}
                </option>
              ))}
            </select>
          </div>

          {filtresActifs && (
            <button
              type="button"
              onClick={() => {
                setNiveau("tous");
                setRecherche("");
                setPage(1);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <EnTeteTriable title="Filleul" field="nom" {...trie} />
              <EnTeteTriable
                title="Ligne de parrainage"
                field="niveau"
                className="hidden sm:table-cell"
                {...trie}
              />
              <EnTeteTriable
                title={`Chiffre d'affaires ${annee}`}
                field="ca"
                {...trie}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargement &&
              [0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3} className="px-3 py-4">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!chargement &&
              lignes.map((filleul) => (
                <TableRow key={filleul.id} className="hover:bg-gray-50/60">
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef3e8] text-xs font-semibold text-[#b35a10] sm:flex"
                      >
                        {initiales(nomComplet(filleul))}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {nomComplet(filleul)}
                        </p>
                        <div className="mt-1 sm:hidden">
                          <PastilleNiveau niveau={filleul.niveau} />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-3 py-3 sm:table-cell">
                    <PastilleNiveau niveau={filleul.niveau} />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <JaugeCA ca={filleul.chiffre_affaires} />
                  </TableCell>
                </TableRow>
              ))}
            {!chargement && lignes.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <UsersRound className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">{message}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <PiedPagination
          debut={visibles.length === 0 ? 0 : premier + 1}
          fin={Math.min(premier + LIGNES_PAR_PAGE, visibles.length)}
          total={visibles.length}
          element="filleul"
          page={pageCourante}
          totalPages={totalPages}
          onPrecedent={() => setPage(pageCourante - 1)}
          onSuivant={() => setPage(pageCourante + 1)}
        />
      </div>
    </>
  );
}

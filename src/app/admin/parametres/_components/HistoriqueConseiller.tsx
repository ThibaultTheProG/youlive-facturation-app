"use client";

import { useEffect, useState } from "react";
import type { EvenementHistorique } from "@/app/api/conseillers/historique/route";

const CHAMPS: Record<string, string> = {
  prenom: "Prénom",
  nom: "Nom",
  email: "Email",
  telephone: "Téléphone",
  mobile: "Mobile",
  adresse: "Adresse",
  role: "Rôle",
  idapimo: "Identifiant Apimo",
  tva: "Assujetti à la TVA",
  taux_tva: "Taux de TVA (%)",
  tva_recrutement: "TVA sur les recrutements",
  typecontrat: "Type de contrat",
  siren: "SIREN / RSAC / RCS",
  retrocession: "Rétrocession (%)",
  auto_parrain: "Auto-parrainage",
  adresse_facture: "Adresse de facturation",
  nom_societe_facture: "Société de facturation",
  siren_facture: "SIREN de facturation",
  email_facture: "Email de facturation",
  actif: "Compte actif",
  motDePasse: "Mot de passe",
  parrainage: "Chaîne de parrainage",
};

const SOURCES: Record<string, { libelle: string; couleur: string }> = {
  "admin:fiche": { libelle: "Fiche (admin)", couleur: "bg-blue-50 text-blue-700" },
  "conseiller:fiche": { libelle: "Fiche (conseiller)", couleur: "bg-emerald-50 text-emerald-700" },
  "admin:desactivation": { libelle: "Désactivation", couleur: "bg-blue-50 text-blue-700" },
  "conseiller:mot-de-passe": { libelle: "Mot de passe (conseiller)", couleur: "bg-emerald-50 text-emerald-700" },
  "lien:mot-de-passe": { libelle: "Lien d'invitation", couleur: "bg-emerald-50 text-emerald-700" },
  "systeme:synchro-apimo": { libelle: "Synchro Apimo", couleur: "bg-gray-100 text-gray-600" },
  "systeme:recalcul-ca": { libelle: "Recalcul du CA", couleur: "bg-gray-100 text-gray-600" },
  "systeme:reinitialisation-ca": { libelle: "Réinitialisation annuelle", couleur: "bg-gray-100 text-gray-600" },
};

const estSysteme = (source: string | null) => !!source && source.startsWith("systeme:");

function valeur(champ: string | null, v: string | null): string {
  if (v === null || v === "") return "—";
  if (champ === "tva" || champ === "tva_recrutement" || champ === "actif") {
    return v === "true" ? "Oui" : "Non";
  }
  return v;
}

function Origine({ evt }: { evt: EvenementHistorique }) {
  if (evt.source === null) {
    return (
      <span
        className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
        title="Écriture qui n'est pas passée par l'application : SQL manuel ou script"
      >
        Hors application
      </span>
    );
  }
  const s = SOURCES[evt.source] ?? { libelle: evt.source, couleur: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.couleur}`}>
      {s.libelle}
    </span>
  );
}

/**
 * Historique des modifications d'un conseiller (fiche et parrainage). Les écritures du
 * système (synchro, recalcul du CA) sont masquées par défaut : elles couvrent l'essentiel du
 * volume et ne sont presque jamais ce que l'on cherche. À monter avec `key={conseillerId}` :
 * l'état repart de zéro à chaque conseiller.
 */
export default function HistoriqueConseiller({ conseillerId }: { conseillerId: number }) {
  const [evenements, setEvenements] = useState<EvenementHistorique[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [avecSysteme, setAvecSysteme] = useState(false);

  useEffect(() => {
    let annule = false;
    fetch(`/api/conseillers/historique?id=${conseillerId}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `Erreur HTTP ${r.status}`);
        if (!annule) setEvenements(data.evenements);
      })
      .catch((e) => {
        if (!annule) setErreur(e instanceof Error ? e.message : String(e));
      });
    return () => {
      annule = true;
    };
  }, [conseillerId]);

  if (erreur) return <p className="text-sm text-red-600">Historique indisponible : {erreur}</p>;
  if (!evenements) return <p className="text-sm text-gray-500">Chargement de l&apos;historique…</p>;

  const visibles = avecSysteme ? evenements : evenements.filter((e) => !estSysteme(e.source));
  const masques = evenements.length - visibles.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {visibles.length} modification{visibles.length > 1 ? "s" : ""}
          {!avecSysteme && masques > 0 && ` · ${masques} du système masquée${masques > 1 ? "s" : ""}`}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={avecSysteme}
            onChange={(e) => setAvecSysteme(e.target.checked)}
            className="h-4 w-4 accent-[#E07C24]"
          />
          Afficher les écritures du système
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Aucune modification enregistrée. Le journal existe depuis le 04/11/2026 : les
          changements antérieurs n&apos;y figurent pas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Champ</th>
                <th className="px-3 py-2 font-medium">Avant</th>
                <th className="px-3 py-2 font-medium">Après</th>
                <th className="px-3 py-2 font-medium">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibles.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {new Date(e.date).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Paris",
                    })}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {e.champ
                      ? CHAMPS[e.champ] ?? e.champ
                      : e.operation === "INSERT"
                        ? "Compte créé"
                        : "Compte supprimé"}
                  </td>
                  {e.champ === "motDePasse" ? (
                    <td className="px-3 py-2 text-gray-500" colSpan={2}>
                      Modifié (valeurs non conservées)
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-gray-600">{e.champ ? valeur(e.champ, e.avant) : ""}</td>
                      <td className="px-3 py-2 text-gray-900">{e.champ ? valeur(e.champ, e.apres) : ""}</td>
                    </>
                  )}
                  <td className="space-y-1 px-3 py-2">
                    <Origine evt={e} />
                    {e.auteur && <div className="text-xs text-gray-500">{e.auteur}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EVENEMENTS_EMAIL,
  MODES,
  type DefinitionEvenement,
  type DestinataireEmail,
  type EmailsConfigurationReponse,
  type ModeDestinataire,
} from "@/lib/emailsEvenements";

const CLE = "/api/emails-destinataires";

const fetcher = async (url: string): Promise<EmailsConfigurationReponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur lors de la lecture des destinataires");
  return response.json();
};

/** Appelle l'API et rend le message d'erreur du serveur tel quel : il est écrit pour l'admin. */
async function appeler(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const corps = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(corps.error || `Erreur HTTP ${response.status}`);
  return corps;
}

export default function PanneauEmails() {
  const { data, error, isLoading, mutate } = useSWR(CLE, fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des destinataires...
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-500">
        Impossible de lire les destinataires. Rechargez la page, ou réessayez dans un instant.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-gray-700">
        Les emails de la préproduction ne partent jamais à ces adresses : ils sont déroutés vers une
        boîte de test, et le sujet indique à qui ils auraient été adressés.
      </p>
      {EVENEMENTS_EMAIL.map((definition) => (
        <CarteEvenement
          key={definition.evenement}
          definition={definition}
          destinataires={data.destinataires.filter((d) => d.evenement === definition.evenement)}
          parDefaut={data.parDefaut}
          onChange={() => mutate()}
        />
      ))}
    </div>
  );
}

interface CarteEvenementProps {
  definition: DefinitionEvenement;
  destinataires: DestinataireEmail[];
  parDefaut: EmailsConfigurationReponse["parDefaut"];
  onChange: () => void;
}

function CarteEvenement({ definition, destinataires, parDefaut, onChange }: CarteEvenementProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">{definition.libelle}</h2>
      <p className="mt-1 text-sm text-gray-500">{definition.description}</p>
      {!definition.modes.includes("a") && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-medium">Destinataire :</span> {definition.principal.toLowerCase()},
          automatiquement.
        </p>
      )}

      <div className="mt-4 space-y-5">
        {definition.modes.map((mode) => (
          <ListeAdresses
            key={mode}
            evenement={definition.evenement}
            mode={mode}
            lignes={destinataires.filter((d) => d.mode === mode)}
            repli={parDefaut[`${definition.evenement}:${mode}`]}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

interface ListeAdressesProps {
  evenement: DefinitionEvenement["evenement"];
  mode: ModeDestinataire;
  lignes: DestinataireEmail[];
  /** Adresses des variables d'environnement, en vigueur tant que la liste est vide. */
  repli?: string[];
  onChange: () => void;
}

function ListeAdresses({ evenement, mode, lignes, repli, onChange }: ListeAdressesProps) {
  const [nouvelle, setNouvelle] = useState("");
  const [ajout, setAjout] = useState(false);

  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelle.trim()) return;
    setAjout(true);
    try {
      await appeler(CLE, {
        method: "POST",
        body: JSON.stringify({ evenement, mode, adresse: nouvelle }),
      });
      setNouvelle("");
      toast.success("Adresse ajoutée");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ajout impossible");
    } finally {
      setAjout(false);
    }
  };

  const identifiant = `${evenement}-${mode}`;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900">{MODES[mode]}</h3>

      {lignes.length === 0 && (
        <p className="mt-1.5 text-sm text-gray-500">
          {repli
            ? `Aucune adresse enregistrée : ce sont celles de la configuration du serveur qui sont utilisées (${repli.join(", ") || "aucune"}). Ajoutez-en une pour les remplacer.`
            : "Aucune adresse."}
        </p>
      )}

      <ul className="mt-1.5 divide-y divide-gray-100">
        {lignes.map((ligne) => (
          <LigneAdresse key={ligne.id} ligne={ligne} onChange={onChange} />
        ))}
      </ul>

      <form onSubmit={ajouter} className="mt-2 flex gap-2">
        <label htmlFor={identifiant} className="sr-only">
          Ajouter une adresse ({MODES[mode].toLowerCase()})
        </label>
        <Input
          id={identifiant}
          type="email"
          value={nouvelle}
          onChange={(e) => setNouvelle(e.target.value)}
          placeholder="prenom.nom@exemple.fr"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" disabled={ajout || !nouvelle.trim()}>
          {ajout ? <Loader2 className="animate-spin" /> : <Plus />}
          Ajouter
        </Button>
      </form>
    </div>
  );
}

function LigneAdresse({ ligne, onChange }: { ligne: DestinataireEmail; onChange: () => void }) {
  const [edition, setEdition] = useState(false);
  const [valeur, setValeur] = useState(ligne.adresse);
  const [occupee, setOccupee] = useState(false);

  const agir = async (action: () => Promise<unknown>, succes: string) => {
    setOccupee(true);
    try {
      await action();
      toast.success(succes);
      setEdition(false);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setOccupee(false);
    }
  };

  const enregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (valeur.trim().toLowerCase() === ligne.adresse) return setEdition(false);
    void agir(
      () => appeler(`${CLE}/${ligne.id}`, { method: "PUT", body: JSON.stringify({ adresse: valeur }) }),
      "Adresse modifiée"
    );
  };

  const supprimer = () =>
    agir(() => appeler(`${CLE}/${ligne.id}`, { method: "DELETE" }), "Adresse retirée");

  if (edition) {
    return (
      <li className="py-2">
        <form onSubmit={enregistrer} className="flex gap-2">
          <Input
            type="email"
            aria-label="Adresse email"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            className="max-w-sm"
            autoFocus
          />
          <Button type="submit" size="icon" variant="outline" disabled={occupee} aria-label="Enregistrer">
            {occupee ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Annuler"
            onClick={() => {
              setValeur(ligne.adresse);
              setEdition(false);
            }}
          >
            <X />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="truncate text-sm text-gray-800">{ligne.adresse}</span>
      <span className="flex shrink-0 gap-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Modifier ${ligne.adresse}`}
          disabled={occupee}
          onClick={() => setEdition(true)}
        >
          <Pencil />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Retirer ${ligne.adresse}`}
          disabled={occupee}
          onClick={supprimer}
        >
          {occupee ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </span>
    </li>
  );
}

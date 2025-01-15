export interface Conseiller {
  prenom: string;
  nom: string;
  id: number;
  email?: string;
  telephone?: string;
  adresse?: string;
  idapimo: number;
  tva?: boolean;
  typecontrat?: string;
  siren?: number;
  chiffre_affaires?: number;
  retrocession?: number;
  parrain_id?: number;
}

export type SelectItem = {
  key: number;
  name: string;
};

export interface User {
  id: number;
  role: "admin" | "conseiller";
  name: string;
  email: string;
}

export type inputCustomProps = {
  disable: boolean;
  name?: string;
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (val: string | number) => void;
};

// Pour gérer les contrats :
export interface Contract {
  id: string;
  step: string;
  agency: string;
  property: string;
  currency: string;
  price: string;
  price_net: string;
  commission: string;
  commission_agency: string;
  vat: string;
  vat_rate: string;
  entries?: Entries[];
  relationid: number; // Déclarez la clé entries comme un tableau facultatif
}

export interface Entries {
  user: number | string;
  amount: number | string;
  vat: number | string;
  vat_rate: number | string;
}

// Pour gérer les factures
export interface Facture {
  id: number;
  user_id: number;
  type: string;
  honoraire: number;
  retrocession_amount: number;
  statut_dispo: string;
  statut_paiement: string;
  url_fichier: string | null;
  created_at: string;
  updated_at: string;
  numero_mandat: number;
  date_signature: string;
}
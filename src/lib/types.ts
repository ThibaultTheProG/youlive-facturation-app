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
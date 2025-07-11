export interface Conseiller {
  prenom: string;
  nom: string;
  id: number;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  idapimo: number;
  tva?: boolean;
  typecontrat?: string;
  siren?: number;
  chiffre_affaires: number;
  retrocession?: number;
  parrain_id?: number;
  auto_parrain?: string;
  niveau?:string;
  // Informations facture de recrutement
  nom_societe_facture?: string;
  siren_facture?: string;
  adresse_facture?: string;
}

export type SelectItem = {
  key: number;
  name: string;
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "conseiller";
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
  agency?: string;
  property?: string;
  currency?: string;
  commission: string;
  commission_agency?: string;
  vat?: string;
  vat_rate?: string;
  entries?: Entries[];
  contract_at?: string;
  date_signature: string;
}

export interface Entries {
  id: number;
  user: number | string;
  amount: number | string;
  vat: number | string;
  vat_rate: number | string;
  type: string;
}

export interface RelationContrat {
  honoraires_agent: number;
  user_id: number;
  retrocession: number;
  relationid: number;
}

// Pour gérer les contacts
export interface ContactApi {
  id: number,
  firstname: string,
  lastname: string,
  email: string,
  mobile: string,
  phone: string,
  address: string,
  city: Ville
}


export interface Contact {
  id?: number;
  prenom: string;
  nom: string;
  email: string;
  mobile: string | null;
  phone:string | null;
  adresse: string;
  ville: Ville;
}

export interface Ville {
  name: string;
  zipcode: string;
}

export interface Property {
  id: string;
  propertyId?: string;
  adresse: string;
  reference: string;
  city?: Ville;  // ✅ Ajout de city avec le bon type
  [key: string]: string | number | null | undefined | Ville;
}

// Pour gérer les factures
export interface Facture {
  id: number;
  type: string;
  honoraires_agent: string;
  retrocession: string;
  statut_paiement: string;
  statut_envoi: string;
  created_at: string;
  added_at?: string;
  numero_mandat: string;
  date_signature: string;
  numero: string;
  vat_rate: number;
  apporteur: string;
  apporteur_amount: number;
}

interface Filleul {
  id: number,
  prenom: string,
  nom: string
}

export interface FactureDetaillee extends Facture {
  conseiller: Conseiller;
  contrat: Contract;
  propriete: Property;
  acheteurs: Contact[];
  proprietaires: Contact[];
  filleul?: Filleul;
}

// Pour gérer le context
export interface AuthContextType {
  user: User | null; // Typage approprié pour l'utilisateur
  loading: boolean; // Indique si l'authentification est en cours
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

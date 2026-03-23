export interface Permis {
  id: string;
  numero_permis: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  nationalite: string;
  photo?: string;
  telephone?: string;
  categorie_permis: string;
  date_creation: string;
}

export interface Conducteur {
  id: string;
  driver_id: string;
  numero_permis: string;
  email?: string;
  code_pin?: string;
  ville: string;
  commune: string;
  adresse: string;
  ecole_formation?: string;
  nom?: string;
  prenom?: string;
  photo?: string;
  categorie_permis?: string;
  date_creation: string;
  permis?: Permis;
}

export interface Vehicule {
  id: string;
  plaque: string;
  marque: string;
  modele: string;
  annee: number;
  chassis_no: string;
  energie: string;
  puissance: string;
  ptac?: string;
  usage_categorie: string;
  nom_proprietaire: string;
  phone_proprietaire: string;
  adresse_proprietaire: string;
  date_expiration_vignette: string;
  date_expiration_assurance: string;
  date_prochain_controle: string;
  montant_vignette?: number;
  devise_vignette?: string;
  montant_assurance?: number;
  numero_police_assurance?: string;
  date_creation: string;
}

export interface Amende {
  id: string;
  motif: string;
  montant: number;
  statut: 'INPAYEE' | 'PAYEE';
  conducteur_id: string;
  agent_id?: string;
  date_creation: string;
}

export interface Agent {
  id: string;
  agent_id: string;
  nom: string;
  postnom: string;
  email: string;
  mot_de_passe: string;
  photo?: string;
  date_creation: string;
}

export interface Admin {
  id: string;
  email: string;
  nom: string;
  role: string;
  date_creation: string;
}

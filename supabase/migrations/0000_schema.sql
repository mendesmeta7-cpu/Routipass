-- Création des tables

-- TABLE permis
CREATE TABLE IF NOT EXISTS permis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_permis VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  nationalite VARCHAR(100) NOT NULL,
  photo TEXT, -- URL vers le bucket storage Supabase
  telephone VARCHAR(20),
  categorie_permis VARCHAR(20) NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE conducteurs
CREATE TABLE IF NOT EXISTS conducteurs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id VARCHAR(20) UNIQUE NOT NULL, -- ex: RP-DR-000001
  numero_permis VARCHAR(50) NOT NULL REFERENCES permis(numero_permis) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL, -- Hash bcrypt
  ville VARCHAR(100) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  adresse TEXT NOT NULL,
  ecole_formation VARCHAR(200),
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer la recherche par driver_id et numero_permis
CREATE INDEX IF NOT EXISTS idx_conducteur_driver_id ON conducteurs(driver_id);

-- TABLE vehicules
CREATE TABLE IF NOT EXISTS vehicules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plaque VARCHAR(20) UNIQUE NOT NULL,
  marque VARCHAR(50) NOT NULL,
  modele VARCHAR(50) NOT NULL,
  annee INTEGER NOT NULL,
  numero_chassis VARCHAR(100) UNIQUE NOT NULL,
  energie VARCHAR(50) NOT NULL,
  puissance VARCHAR(20) NOT NULL,
  ptac VARCHAR(20),
  categorie VARCHAR(50) NOT NULL,
  date_expiration_vignette DATE NOT NULL,
  date_expiration_assurance DATE NOT NULL,
  date_prochain_controle DATE NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE conducteur_vehicule (Relation Many-to-Many entre conducteurs et véhicules)
CREATE TABLE IF NOT EXISTS conducteur_vehicule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conducteur_id UUID NOT NULL REFERENCES conducteurs(id) ON DELETE CASCADE,
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
  date_liaison TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conducteur_id, vehicule_id) -- Un conducteur ne peut lier qu'une fois le même véhicule
);

-- TABLE agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id VARCHAR(20) UNIQUE NOT NULL, -- ex: RP-AG-0001
  nom VARCHAR(100) NOT NULL,
  postnom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL, -- Hash bcrypt
  photo TEXT, -- URL vers le bucket storage
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE amendes
CREATE TABLE IF NOT EXISTS amendes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  motif TEXT NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'INPAYEE', -- IMPAYEE ou PAYEE
  conducteur_id UUID NOT NULL REFERENCES conducteurs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE SET NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE alertes
CREATE TABLE IF NOT EXISTS alertes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vue pour les statistiques Admin
CREATE OR REPLACE VIEW stats_admin AS
SELECT
  (SELECT COUNT(*) FROM conducteurs) as total_conducteurs,
  (SELECT COUNT(*) FROM vehicules) as total_vehicules,
  (SELECT COUNT(*) FROM agents) as total_agents,
  (SELECT COUNT(*) FROM amendes) as total_amendes;

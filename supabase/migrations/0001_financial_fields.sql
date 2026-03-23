-- Migration to add financial fields to vehicles
ALTER TABLE vehicules 
ADD COLUMN IF NOT EXISTS montant_vignette DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS devise_vignette VARCHAR(3) DEFAULT 'CDF',
ADD COLUMN IF NOT EXISTS montant_assurance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_police_assurance VARCHAR(100);

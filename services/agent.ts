import { supabase } from '@/lib/supabaseClient';

export interface VerificationResult {
  driver: any;
  vehicules: any[];
  amendes: any[];
  validity: {
    assurance: 'Vert' | 'Orange' | 'Rouge';
    vignette: 'Vert' | 'Orange' | 'Rouge';
    controle_technique: 'Vert' | 'Orange' | 'Rouge';
  };
}

const getPastille = (dateString?: string | null): 'Vert' | 'Orange' | 'Rouge' => {
  if (!dateString) return 'Rouge'; // No date = Expired/Not valid
  
  const expireDate = new Date(dateString);
  const today = new Date();
  
  const diffTime = expireDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Rouge';
  if (diffDays <= 30) return 'Orange';
  return 'Vert';
};

export const agentService = {
  async verifyDriver(driverId: string): Promise<VerificationResult> {
    // 1. Fetch driver basics
    const { data: driver, error: driverError } = await supabase
      .from('conducteurs')
      .select('*')
      .eq('driver_id', driverId)
      .single();
      
    if (driverError || !driver) {
      throw new Error(`Conducteur introuvable pour l'ID: ${driverId}`);
    }

    // 2. Fetch vehicules linked to this driver
    const { data: vehicules } = await supabase
      .from('vehicules')
      .select('*')
      .eq('id', driver.vehicule_id); // Based on how driver is linked to vehicle in MVP

    const mainVehicule = vehicules && vehicules.length > 0 ? vehicules[0] : null;

    // 3. Fetch non-paid amendes
    const { data: amendes } = await supabase
      .from('amendes')
      .select('*')
      .eq('conducteur_id', driver.id)
      .eq('statut', 'Non Payée');

    // 4. Calculate Pastilles (from main vehicle dates)
    let assurancePastille: 'Vert' | 'Orange' | 'Rouge' = 'Rouge';
    let vignettePastille: 'Vert' | 'Orange' | 'Rouge' = 'Rouge';
    let controlePastille: 'Vert' | 'Orange' | 'Rouge' = 'Rouge';

    if (mainVehicule) {
      assurancePastille = getPastille(mainVehicule.date_expiration_assurance);
      vignettePastille = getPastille(mainVehicule.date_expiration_vignette);
      controlePastille = getPastille(mainVehicule.date_prochain_controle);
    }

    return {
      driver,
      vehicules: vehicules || [],
      amendes: amendes || [],
      validity: {
        assurance: assurancePastille,
        vignette: vignettePastille,
        controle_technique: controlePastille
      }
    };
  },

  async logControl(agentId: string, conducteurId: string, statutGlobal: string) {
    const { error } = await supabase
      .from('journal_controles')
      .insert({
        agent_id: agentId,
        conducteur_id: conducteurId,
        statut_global: statutGlobal
      });
      
    if (error) {
      console.error("Erreur journalisation contrôle:", error);
    }
  }
};

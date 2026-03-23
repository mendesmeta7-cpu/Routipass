import { supabase } from '@/lib/supabaseClient';

export const adminService = {
  async createPermis(data: { numero_permis: string, nom: string, prenom: string, categorie_permis: string, date_naissance: string, photo_file?: File }) {
    let photoUrl = null;

    if (data.photo_file) {
      const fileExt = data.photo_file.name.split('.').pop();
      const fileName = `${data.numero_permis}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('permis_photos')
        .upload(fileName, data.photo_file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('permis_photos')
        .getPublicUrl(fileName);
      
      photoUrl = publicUrl;
    }

    const { data: result, error } = await supabase
      .from('permis')
      .insert([
        {
          numero_permis: data.numero_permis,
          nom: data.nom,
          prenom: data.prenom,
          categorie_permis: data.categorie_permis,
          date_naissance: data.date_naissance,
          photo: photoUrl,
          nationalite: 'Congolaise', // Default for now
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async createPermisFictif() {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const numPermis = `CD-TEST-${randomId}`;
    
    const { data, error } = await supabase
      .from('permis')
      .insert([
        {
          numero_permis: numPermis,
          nom: 'SIMULATION',
          prenom: 'Test Conducteur',
          date_naissance: '1990-01-01',
          nationalite: 'Congolaise',
          categorie_permis: 'B',
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createVehicule(data: { 
    plaque: string, 
    marque: string, 
    modele: string, 
    annee: number,
    chassis_no: string,
    energie: string,
    puissance: string,
    usage_categorie: string,
    nom_proprietaire: string,
    phone_proprietaire: string,
    adresse_proprietaire: string,
    ptac?: string,
    date_expiration_vignette: string, 
    date_expiration_assurance: string,
    date_prochain_controle: string,
    montant_vignette?: number,
    devise_vignette?: string,
    montant_assurance?: number,
    numero_police_assurance?: string
  }) {
    const { data: result, error } = await supabase
      .from('vehicules')
      .insert([
        {
          ...data
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async createVehiculeFictif() {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const plaque = `${randomId}AB01`;
    
    const { data, error } = await supabase
      .from('vehicules')
      .insert([
        {
          plaque: plaque,
          marque: 'Toyota',
          modele: 'Hilux',
          annee: 2022,
          chassis_no: `CH-TEST-${randomId}`,
          energie: 'Diesel',
          puissance: '12 CV',
          usage_categorie: 'Privé',
          nom_proprietaire: 'M. Jean Test',
          phone_proprietaire: '+243000000000',
          adresse_proprietaire: 'Gombe, Kinshasa',
          date_expiration_vignette: '2025-12-31',
          date_expiration_assurance: '2025-12-31',
          date_prochain_controle: '2025-12-31',
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async enrollNewAgent(data: { nomComplet: string, matricule: string, photoFile?: File }) {
    let photoUrl = null;

    if (data.photoFile) {
      const fileExt = data.photoFile.name.split('.').pop();
      const fileName = `agent-${data.matricule}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, data.photoFile);

      if (uploadError) {
        console.error("Erreur d'upload photo", uploadError);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
    }

    const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true });
    const nextId = (count || 0) + 1;
    const agentId = `RP-AG-2026-${nextId.toString().padStart(4, '0')}`;
    const codePin = Math.floor(1000 + Math.random() * 9000).toString();

    const { data: result, error } = await supabase
      .from('agents')
      .insert([
        {
          agent_id: agentId,
          nom: data.nomComplet,
          postnom: '', // Gardé vide car Nom Complet utilisé
          email: `agent-${data.matricule.toLowerCase()}@routipass.cd`,
          mot_de_passe: 'agent123',
          matricule: data.matricule,
          statut: 'Actif',
          code_pin: codePin,
          photo: photoUrl
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return result;
  }
};

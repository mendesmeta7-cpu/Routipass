import { supabase } from '@/lib/supabaseClient';
import { Conducteur, Permis, Vehicule, Amende } from '@/types';

// Helper for hashing in the browser
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const conducteurService = {
  async verifyPermis(numeroPermis: string): Promise<Permis | null> {
    const { data, error } = await supabase
      .from('permis')
      .select('*')
      .eq('numero_permis', numeroPermis)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async isNumeroPermisUsed(numeroPermis: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('conducteurs')
      .select('id')
      .eq('numero_permis', numeroPermis)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async createConducteur(data: Omit<Conducteur, 'id' | 'driver_id' | 'date_creation'> & { pin?: string }): Promise<Conducteur> {
    const { pin, ...insertData } = data;
    
    // 1. Get current count for driver_id generation
    const { count, error: countError } = await supabase
      .from('conducteurs')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const nextId = (count || 0) + 1;
    const driverId = `RP-DR-${nextId.toString().padStart(6, '0')}`;

    // Hash the PIN if provided
    let hashedPin = undefined;
    if (pin) {
      hashedPin = await hashPin(pin);
    }

    // 2. Insert conductor
    const { data: conducteur, error } = await supabase
      .from('conducteurs')
      .insert({
        ...insertData,
        driver_id: driverId,
        code_pin: hashedPin
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ce numéro de permis est déjà utilisé, Le compte existe déjà');
      }
      throw error;
    }
    return conducteur;
  },

  async getProfileByDriverId(driverId: string): Promise<Conducteur | null> {
    const { data, error } = await supabase
      .from('conducteurs')
      .select('*, permis(*)')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getProfileByEmail(email: string): Promise<Conducteur | null> {
    const { data, error } = await supabase
      .from('conducteurs')
      .select('*, permis(*)')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getProfileById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('conducteurs')
      .select('*, permis(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(id: string, updates: { email?: string; telephone?: string }): Promise<void> {
    const { error } = await supabase
      .from('conducteurs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getVehicules(conducteurId: string): Promise<Vehicule[]> {
    const { data, error } = await supabase
      .from('conducteur_vehicule')
      .select(`
        vehicule_id,
        vehicules (*)
      `)
      .eq('conducteur_id', conducteurId);

    if (error) throw error;
    return data.map((item: any) => item.vehicules);
  },

  async getAmendes(conducteurId: string): Promise<Amende[]> {
    const { data, error } = await supabase
      .from('amendes')
      .select('*')
      .eq('conducteur_id', conducteurId)
      .order('date_creation', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getFinesIssued(conducteurId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('fines_issued')
      .select('*, fine_types(*), vehicules(*)')
      .eq('conducteur_id', conducteurId)
      .order('date_emission', { ascending: false });

    if (error) throw error;
    return data;
  },

  async findVehiculeByPlaque(plaque: string): Promise<Vehicule | null> {
    const { data, error } = await supabase
      .from('vehicules')
      .select('*')
      .eq('plaque', plaque)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getVehiculeById(id: string): Promise<Vehicule | null> {
    const { data, error } = await supabase
      .from('vehicules')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async lierVehicule(conducteurId: string, vehiculeId: string) {
    const { error } = await supabase
      .from('conducteur_vehicule')
      .insert({
        conducteur_id: conducteurId,
        vehicule_id: vehiculeId,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ce véhicule est déjà lié à votre profil');
      }
      throw error;
    }
  },

  async dissocierVehicule(conducteurId: string, vehiculeId: string) {
    const { error } = await supabase
      .from('conducteur_vehicule')
      .delete()
      .eq('conducteur_id', conducteurId)
      .eq('vehicule_id', vehiculeId);

    if (error) throw error;
  },

  async isVehiculeLinked(conducteurId: string, vehiculeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('conducteur_vehicule')
      .select('id')
      .eq('conducteur_id', conducteurId)
      .eq('vehicule_id', vehiculeId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async getConducteursAssocies(vehiculeId: string, currentConducteurId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('conducteur_vehicule')
      .select(`
        conducteurs (
          id,
          photo
        )
      `)
      .eq('vehicule_id', vehiculeId)
      .neq('conducteur_id', currentConducteurId);

    if (error) {
      console.error("Error fetching associated drivers", error);
      return [];
    }

    // Process the result to return an array of photo URLs
    const photos = data
      .map((item: any) => item.conducteurs?.photo)
      .filter(Boolean); // Filter out nulls/undefined

    return photos;
  },

  async getProfilsAssocies(vehiculeId: string, currentConducteurId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('conducteur_vehicule')
      .select(`
        conducteurs (
          id,
          nom,
          postnom,
          prenom,
          photo
        )
      `)
      .eq('vehicule_id', vehiculeId)
      .neq('conducteur_id', currentConducteurId);

    if (error) {
      console.error("Error fetching associated drivers profiles", error);
      return [];
    }

    return data.map((item: any) => item.conducteurs).filter(Boolean);
  }
};

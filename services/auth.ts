import { supabase } from '@/lib/supabaseClient';
import { conducteurService } from './conducteurs';

const SESSION_KEY = 'rp_session';

// Helper for hashing in the browser (must match conducteurs.ts)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export const authService = {
  async signUp(email: string, motDePasse: string, metadata: any) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        data: metadata,
      },
    });

    if (authError) throw authError;
    return authData;
  },

  async signIn(email: string, motDePasse: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) throw error;
    return data;
  },

  async signInDriver(driverId: string, pin: string) {
    const conducteur = await conducteurService.getProfileByDriverId(driverId);
    if (!conducteur || !conducteur.code_pin) {
      throw new Error("Identifiant ou PIN incorrect.");
    }

    const hashedInput = await hashPin(pin);
    if (hashedInput !== conducteur.code_pin) {
      throw new Error("Identifiant ou PIN incorrect.");
    }

    // For the MVP, we store a simple session object instead of a signed JWT
    // to avoid Node.js dependencies (jsonwebtoken) in the browser.
    const sessionData = { 
      id: conducteur.id, 
      driver_id: conducteur.driver_id, 
      role: 'DRIVER',
      email: conducteur.email,
      iat: Date.now()
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    
    return { user: conducteur, session: sessionData };
  },

  async signInAgent(agentId: string, pin: string) {
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error || !agent) {
      throw new Error("Identifiant ou PIN incorrect.");
    }

    if (agent.code_pin !== pin) {
      throw new Error("Identifiant ou PIN incorrect.");
    }

    if (agent.statut !== 'Actif') {
      throw new Error("Ce compte agent n'est plus actif.");
    }

    // Store local session for Agent MVP
    const sessionData = { 
      id: agent.id, 
      agent_id: agent.agent_id, 
      role: 'AGENT',
      email: agent.email,
      nom: agent.nom,
      matricule: agent.matricule,
      photo: agent.photo,
      iat: Date.now()
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    
    return { user: agent, session: sessionData };
  },

  async signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser() {
    // 1. Check Supabase Auth (Admin/Agent)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;

    // 2. Check local session (Driver or Agent)
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      try {
        const decoded = JSON.parse(sessionStr);
        // Basic expiry check (7 days)
        if (Date.now() - decoded.iat > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(SESSION_KEY);
          return null;
        }

        if (decoded.role === 'DRIVER') {
          return {
            id: decoded.id,
            email: decoded.email,
            user_metadata: {
              driver_id: decoded.driver_id,
              role: 'DRIVER'
            }
          };
        } else if (decoded.role === 'AGENT') {
          return {
            id: decoded.id,
            email: decoded.email,
            user_metadata: {
              agent_id: decoded.agent_id,
              nom: decoded.nom,
              matricule: decoded.matricule,
              photo: decoded.photo,
              role: 'AGENT'
            }
          };
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    return null;
  },
};

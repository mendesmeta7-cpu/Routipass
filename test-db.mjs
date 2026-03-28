import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('conducteur_vehicule')
    .select(`
        conducteurs (
          id,
          nom,
          prenom,
          photo
        )
    `)
    .limit(10);
    
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();

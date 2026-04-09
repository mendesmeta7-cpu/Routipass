"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Loader2, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function RechercheVehiculePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      // Using ilike for case-insensitive partial match on plaque
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .ilike('plaque', `%${search.trim()}%`)
        .limit(10); // LIMIT to prevent massive payload

      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      console.error(error);
      alert("Erreur lors de la recherche : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans pb-10">
      
      {/* Header Premium */}
      <header className="bg-white border-b border-slate-100 p-6 flex flex-col gap-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard-agent/recherche")} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
             <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Recherche Véhicule</h1>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Base de données Nationale</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
           <input 
             type="text"
             placeholder="Plaque ex: CG0123AB"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full h-14 pl-12 pr-32 rounded-[1.5rem] bg-blue-50/50 border border-blue-100 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all uppercase tracking-wider"
           />
           <button 
             type="submit" 
             disabled={loading || !search.trim()}
             className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Rechercher"}
           </button>
        </form>
      </header>

      {/* Results Area */}
      <main className="p-6 max-w-lg mx-auto w-full flex-1">
         {hasSearched && !loading && results.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-70 animate-in fade-in">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                 <AlertCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Aucun véhicule trouvé</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Vérifiez la plaque d'immatriculation saisie.</p>
           </div>
         )}
         
         {loading ? (
            <div className="grid gap-4 mt-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white p-6 rounded-[2rem] h-28 animate-pulse shadow-sm" />
               ))}
            </div>
         ) : (
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {results.map((vehicule) => (
                 <button 
                   key={vehicule.id}
                   onClick={() => router.push(`/dashboard-agent/recherche/vehicule/${vehicule.id}`)}
                   className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 text-left transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                 >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                       <Car className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{vehicule.plaque}</h3>
                       <p className="text-xs font-bold text-slate-500 truncate uppercase mt-1">
                         {vehicule.marque} {vehicule.modele}
                       </p>
                    </div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2 border-l border-slate-100">
                      Voir<br/>Détails
                    </div>
                 </button>
               ))}
            </div>
         )}
      </main>
    </div>
  );
}

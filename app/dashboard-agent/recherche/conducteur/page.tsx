"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2, Search, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function RechercheConducteurPage() {
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
    const searchTerm = `%${search.trim()}%`;
    
    try {
       // Search by driver_id
       const { data: byDriverId, error: err1 } = await supabase
         .from('conducteurs')
         .select('*, permis(*)')
         .ilike('driver_id', searchTerm)
         .limit(10);
         
       if (err1) throw err1;

       // Search by permis (nom or prenom)
       const { data: byName, error: err2 } = await supabase
         .from('conducteurs')
         .select('*, permis!inner(*)')
         .or(`nom.ilike.${searchTerm},prenom.ilike.${searchTerm}`, { foreignTable: 'permis' })
         .limit(10);
         
       if (err2 && err2.code !== 'PGRST116') {
          // If foreignTable or throws, we fallback silently and just use byDriverId results
          console.warn("Foreign table full text search might not be natively supported or failed", err2);
       }

       // Merge results avoiding duplicates
       const merged = [...(byDriverId || [])];
       if (byName) {
         byName.forEach((item: any) => {
           if (!merged.find(m => m.id === item.id)) {
             merged.push(item);
           }
         });
       }

       setResults(merged);
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
             <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Recherche Conducteur</h1>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Fichier Fédéral des Permis</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
           <input 
             type="text"
             placeholder="Nom, Prénom ou ID (RP-DR-...)"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full h-14 pl-12 pr-32 rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all uppercase tracking-wider placeholder:normal-case"
           />
           <button 
             type="submit" 
             disabled={loading || !search.trim()}
             className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
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
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Aucun conducteur trouvé</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Vérifiez les informations saisies.</p>
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
               {results.map((conducteur) => {
                 const photo = conducteur.photo_url || conducteur.permis?.photo;
                 const fullName = conducteur.permis ? `${conducteur.permis.nom} ${conducteur.permis.prenom}` : "Inconnu";
                 
                 return (
                   <button 
                     key={conducteur.id}
                     onClick={() => router.push(`/conducteur-public/${conducteur.id}`)}
                     className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 text-left transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                   >
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm ring-2 ring-slate-50 group-hover:ring-emerald-100 overflow-hidden transition-all">
                         {photo ? (
                           <img src={photo} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-6 h-6 text-slate-400" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                         <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1.5 truncate">{fullName}</h3>
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-100 mb-1">
                           {conducteur.driver_id}
                         </p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Fiche Publique
                         </p>
                      </div>
                   </button>
                 );
               })}
            </div>
         )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

interface FineType {
  id: string;
  nature: string;
  montant: number;
  devise: string;
  delai_paiement: number;
}

export default function InfractionsManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [nature, setNature] = useState("");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("CDF");
  const [delai, setDelai] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFineTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fine_types')
      .select('*')
      .order('nature', { ascending: true });
    
    if (data) setFineTypes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFineTypes();
  }, []);

  const handleOpenModal = (fineType?: FineType) => {
    if (fineType) {
      setEditingId(fineType.id);
      setNature(fineType.nature);
      setMontant(fineType.montant.toString());
      setDevise(fineType.devise);
      setDelai(fineType.delai_paiement.toString());
    } else {
      setEditingId(null);
      setNature("");
      setMontant("");
      setDevise("CDF");
      setDelai("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nature,
      montant: parseInt(montant),
      devise,
      delai_paiement: parseInt(delai)
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase
        .from('fine_types')
        .update(payload)
        .eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('fine_types')
        .insert([payload]);
      error = err;
    }

    if (!error) {
      setIsModalOpen(false);
      fetchFineTypes();
    } else {
      alert("Erreur lors de l'enregistrement : " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce type d'infraction ?")) return;
    
    const { error } = await supabase
      .from('fine_types')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchFineTypes();
    } else {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-12 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A] border-none shadow-xl h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin/dashboard")}
              className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-700 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight">Types d'Infractions</h1>
          </div>
          <Button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl h-12 px-6 shadow-lg shadow-blue-500/20 gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouveau Type
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement des paramètres...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fineTypes.map((type, i) => (
              <div 
                key={type.id} 
                className="glass-card rounded-[2.5rem] p-8 border-white/80 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(type)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(type.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-2">{type.nature}</h3>
                
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Montant</span>
                    <span className="text-slate-900 text-sm">{type.montant.toLocaleString()} {type.devise}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Délai</span>
                    <span className="text-slate-900 text-sm">{type.delai_paiement} Jours</span>
                  </div>
                </div>
              </div>
            ))}

            {fineTypes.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-[3rem] border-dashed border-2 border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune infraction configurée</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal - Simulated via state overlay for demo if Shadcn is not complex */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative animate-scale-in">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {editingId ? "Modifier l'infraction" : "Nouvelle infraction"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
              Configuration du référentiel maître
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nature de l'infraction</label>
                <Input 
                  value={nature} 
                  onChange={(e) => setNature(e.target.value)}
                  placeholder="Ex: Excès de vitesse"
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white text-sm font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant</label>
                  <Input 
                    type="number"
                    value={montant} 
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="70000"
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Devise</label>
                  <select 
                    value={devise}
                    onChange={(e) => setDevise(e.target.value)}
                    className="w-full h-14 px-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white text-sm font-bold outline-none"
                  >
                    <option value="CDF">CDF (Francs Congolais)</option>
                    <option value="USD">USD (Dollars US)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Délai de paiement (Jours)</label>
                <Input 
                  type="number"
                  value={delai} 
                  onChange={(e) => setDelai(e.target.value)}
                  placeholder="7"
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white text-sm font-bold"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[1.5rem] mt-4 shadow-xl shadow-blue-500/20 gap-2 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {editingId ? "Mettre à jour" : "Créer l'infraction"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

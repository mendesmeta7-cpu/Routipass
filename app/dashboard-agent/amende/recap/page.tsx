"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText,
  MapPin,
  Calendar,
  X,
  Plus,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function AmendeRecapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Additional Fields
  const [remarques, setRemarques] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem("pending_fine");
    if (!savedData) {
      router.push("/dashboard-agent");
      return;
    }
    setData(JSON.parse(savedData));
    setLoading(false);
  }, [router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    let photoUrl = null;

    try {
      // 1. Upload Photo if present
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${data.agent_id}_${Date.now()}.${fileExt}`;
        const filePath = `issued/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('fines_photos')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fines_photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // 2. Insert into fines_issued
      const payload = {
        agent_id: data.agent_id,
        conducteur_id: data.conducteur_id,
        vehicule_id: data.vehicule_id,
        type_id: data.type_id,
        nature_infraction: data.nature_infraction,
        montant: data.montant,
        devise: data.devise,
        delai_paiement: data.delai_paiement,
        lieu_gps: data.lieu_gps,
        remarques: remarques,
        photo_url: photoUrl,
        statut: 'IMPAYÉE',
        date_emission: data.date_emission
      };

      const { error: insertError } = await supabase
        .from('fines_issued')
        .insert([payload]);

      if (insertError) throw insertError;

      // 3. Cleanup and Redirect
      localStorage.removeItem("pending_fine");
      router.push("/dashboard-agent/amende/success");

    } catch (error: any) {
      console.error("Submission error:", error);
      alert("Erreur lors de la soumission : " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3b6a] animate-spin" />
        <p className="text-[10px] font-black text-[#1e3b6a] uppercase tracking-widest text-center">Finalisation du dossier...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans pb-10">
      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => router.back()} className="text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Récapitulatif</h1>
      </header>

      <main className="p-6 space-y-6 max-w-xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
        
        {/* Synthèse Infraction */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data.nature_infraction}</h2>
                 <p className="text-rose-600 font-bold text-[10px] uppercase tracking-[0.2em]">Sanction Administrative</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Conducteur</p>
                 <p className="text-sm font-bold text-slate-900 truncate">{data.conducteur_nom}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Véhicule</p>
                 <p className="text-sm font-bold text-slate-900">{data.vehicule_plaque}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                   <Calendar className="w-3 h-3" /> Date & Heure
                 </p>
                 <p className="text-sm font-bold text-slate-900">{new Date(data.date_emission).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                   <MapPin className="w-3 h-3" /> Coordonnées GPS
                 </p>
                 <p className="text-sm font-bold text-slate-600">{data.lieu_gps}</p>
              </div>
           </div>

           <div className="bg-slate-50 px-6 py-4 rounded-2xl flex justify-between items-center mt-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Montant Total</span>
              <span className="text-xl font-black text-rose-600">{data.montant.toLocaleString()} {data.devise}</span>
           </div>
        </div>

        {/* Champs Additionnels */}
        <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 space-y-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Remarques (Optionnel)</label>
              <textarea 
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                placeholder="Détails additionnels sur l'infraction..."
                className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
              />
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Pièce Jointe / Photo</label>
              <div className="flex gap-4 items-end">
                {photoPreview ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Ajouter une photo de preuve</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
           </div>

           <Button 
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className={`w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all gap-3 ${
              isSubmitting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
           >
             {isSubmitting ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
                 Transmission en cours...
               </>
             ) : (
               <>
                 <CheckCircle2 className="w-6 h-6" />
                 Soumission Finale
               </>
             )}
           </Button>
        </div>

      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileSignature, 
  History, 
  ShieldCheck,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { conducteurService } from "@/services/conducteurs";
import { authService } from "@/services/auth";
import { Conducteur, Vehicule } from "@/types";
import { getUsageIllustration } from "@/utils/vehicleUtils";

export default function ConducteurPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [conducteur, setConducteur] = useState<any | null>(null);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch public profile
        const profile = await conducteurService.getProfileByDriverId(driverId);
        if (!profile) {
          setLoading(false);
          return;
        }

        // 2. Check if current user is the owner
        const user = await authService.getCurrentUser();
        if (user && user.id === profile.id) {
          router.replace("/dashboard-conducteur");
          return;
        }

        setConducteur(profile);

        // 3. Fetch fleet
        const fleet = await conducteurService.getVehicules(profile.id);
        setVehicules(fleet);

      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [driverId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-xs font-black uppercase tracking-widest text-blue-600/50">Chargement du profil public...</span>
      </div>
    );
  }

  if (!conducteur) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-6 text-center">
         <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
         </div>
         <h1 className="text-xl font-black text-[#1e3b6a] mb-2">Profil Introuvable</h1>
         <p className="text-sm text-slate-500 font-bold mb-8">Ce conducteur n'existe pas ou son compte a été désactivé.</p>
         <Button onClick={() => router.back()} variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-xs px-8 h-14">
            Retour
         </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] md:p-8 flex items-center justify-center font-sans animate-in fade-in duration-500">
      
      <main className="w-full bg-white flex flex-col min-h-screen relative shadow-2xl md:rounded-[3rem] overflow-hidden">
        
        {/* HEADER SECTION (Restricted) */}
        <section className="bg-[#1e3b6a] rounded-b-[2.5rem] pt-12 pb-24 px-6 md:px-12 lg:px-24 relative shrink-0">
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-10 left-6 outline-none hover:scale-105 transition-transform"
          >
            <div className="relative bg-white/10 p-2 rounded-full border border-white/10">
              <ChevronLeft className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
          </button>

          {/* Badge Vérifié (Suggestion) */}
          <div className="absolute top-10 right-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full backdrop-blur-md">
             <ShieldCheck className="w-4 h-4 text-emerald-400" />
             <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Identité Vérifiée PNC</span>
          </div>

          <div className="flex gap-5 items-start pr-8 mt-4">
            <div className="w-24 h-24 rounded-[2rem] bg-white border-[4px] border-white/20 shadow-2xl overflow-hidden shrink-0 transform -rotate-3">
               {conducteur.photo ? (
                 <img src={conducteur.photo} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-300">
                    <User className="w-10 h-10" />
                 </div>
               )}
            </div>

            <div className="flex flex-col flex-1 gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {conducteur.prenom} {conducteur.nom}
              </h1>
              <div className="flex items-center gap-2">
                 <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-white/70 uppercase">Permis</div>
                 <p className="text-sm font-black text-white/95 tracking-wider">
                   {conducteur.numero_permis}
                 </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end px-2">
            <Button 
               onClick={() => setShowContactModal(true)}
               className="bg-[#e9b11e] hover:bg-yellow-500 text-black px-10 py-6 rounded-2xl shadow-xl shadow-yellow-900/20 font-black text-sm tracking-widest uppercase"
            >
              Contact
            </Button>
          </div>
        </section>

        {/* GENERAL INFO (Read Only) */}
        <div className="px-5 md:px-12 lg:px-24 -mt-16 relative z-10 w-full shrink-0">
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-blue-900/5 border border-gray-100 space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <FileSignature className="w-5 h-5 text-[#1e3b6a]" />
                <h2 className="text-sm font-black text-[#1e3b6a] uppercase tracking-widest">Informations Générales</h2>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
               <InfoItem label="Nationalité" value={conducteur.permis?.nationalite || "N/A"} />
               <InfoItem label="Date de naissance" value={conducteur.permis?.date_naissance || "N/A"} />
               <InfoItem label="Catégorie Permis" value={conducteur.categorie_permis || conducteur.permis?.categorie_permis || "N/A"} />
               <InfoItem label="Ville / Commune" value={`${conducteur.ville || ""} - ${conducteur.commune || ""}`} />
             </div>
             
             <div className="pt-3 border-t border-gray-50">
                <InfoItem label="Adresse de résidence" value={conducteur.adresse || "N/A"} />
             </div>
          </div>
        </div>

        {/* EXPERIENCE BUTTON (Keep) */}
        <div className="px-5 md:px-12 lg:px-24 mt-6">
           <button className="w-full bg-[#f4b616]/10 hover:bg-[#f4b616]/20 text-[#1e3b6a] py-5 rounded-2xl border-2 border-dashed border-[#f4b616]/30 flex items-center justify-center gap-3 transition-all active:scale-95 group">
              <History className="w-5 h-5 text-[#f4b616] group-hover:rotate-12 transition-transform" />
              <span className="font-black text-sm uppercase tracking-widest">Consulter Expérience et Casier</span>
           </button>
        </div>

        {/* FLEET SECTION */}
        <div className="flex-1 px-5 md:px-12 lg:px-24 mt-8 pb-10">
           <h2 className="text-xl font-black text-[#1e3b6a] mb-6 px-1 flex items-center gap-3">
              Flotte du conducteur
              <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">{vehicules.length} UNITÉS</span>
           </h2>

           <div className="space-y-4">
             {vehicules.length === 0 ? (
               <div className="py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center px-6">
                  <p className="text-sm font-bold text-gray-400">Ce conducteur n'a aucun véhicule associé à son profil.</p>
               </div>
             ) : (
               vehicules.map((v, idx) => (
                 <div key={v.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center p-2 shrink-0">
                       <img src={getUsageIllustration(v.usage_categorie || 'Privé')} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-[#1e3b6a] text-base truncate">{v.marque} {v.modele}</h4>
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{v.plaque}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actif</span>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </main>

      {/* CONTACT MODAL (Read Only / Agent View) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner shrink-0 text-blue-600">
              <Phone className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-[#1e3b6a] text-center tracking-tight mb-2">Canaux de Contact</h3>
            <p className="text-sm text-center text-gray-500 mb-10 font-bold leading-relaxed px-2">
              Coordonnées déclarées par le conducteur lors de son enrôlement.
            </p>

            <div className="w-full flex flex-col gap-4">
               {/* Email */}
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-[#1e3b6a] transition-all cursor-pointer" onClick={() => window.location.href=`mailto:${conducteur.email}`}>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e3b6a] shadow-sm">
                     <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                     <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Email</span>
                     <span className="text-sm font-bold text-[#1e3b6a] truncate">{conducteur.email || "Non renseigné"}</span>
                  </div>
               </div>

               {/* Phone */}
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-[#1e3b6a] transition-all cursor-pointer" onClick={() => { if(conducteur.telephone) window.location.href=`tel:${conducteur.telephone}` }}>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1e3b6a] shadow-sm">
                     <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                     <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Téléphone</span>
                     <span className="text-sm font-bold text-[#1e3b6a] truncate">{conducteur.telephone || "Aucun numéro"}</span>
                  </div>
               </div>
            </div>

            <Button
              onClick={() => setShowContactModal(false)}
              className="h-16 rounded-2xl bg-gray-900 text-white w-full mt-10 font-black text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-[#1e3b6a] truncate">{value}</span>
    </div>
  );
}

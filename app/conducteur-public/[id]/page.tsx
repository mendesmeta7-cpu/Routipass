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

        const conducteurData = {
          ...profile,
          nom: profile.nom || profile.permis?.nom,
          prenom: profile.prenom || profile.permis?.prenom,
          photo: profile.photo || profile.permis?.photo,
          categorie_permis: profile.categorie_permis || profile.permis?.categorie_permis
        };

        setConducteur(conducteurData);

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
        <section className="bg-[#e9b11e] rounded-b-[2rem] pt-12 pb-24 px-6 md:px-12 lg:px-24 relative shrink-0">
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-10 left-6 outline-none hover:scale-105 transition-transform"
          >
            <div className="relative bg-white/20 p-2 rounded-full">
              <ChevronLeft className="w-5 h-5 text-black" strokeWidth={2} />
            </div>
          </button>

          {/* Badge Vérifié (Suggestion) */}
          <div className="absolute top-10 right-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full backdrop-blur-md">
             <ShieldCheck className="w-4 h-4 text-emerald-600" />
             <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Identité Vérifiée PNC</span>
          </div>

          <div className="flex gap-4 items-start pr-8 mt-4">
            <div className="w-20 h-20 rounded-full bg-white border-[3px] border-white shadow-xl overflow-hidden shrink-0 mt-1 object-cover">
               {conducteur.photo ? (
                 <img src={conducteur.photo} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User className="text-gray-400 w-6 h-6" />
                 </div>
               )}
            </div>

            <div className="flex flex-col flex-1">
              <h1 className="text-2xl font-black font-serif text-black tracking-tight leading-none mb-1">
                {conducteur.prenom} {conducteur.nom}
              </h1>
              <p className="text-xs font-bold text-black/80">
                Permis : {conducteur.numero_permis}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 px-2">
            <button 
               onClick={() => setShowContactModal(true)}
               className="bg-white px-6 py-2 rounded-2xl shadow-sm hover:bg-gray-50 font-black text-xs tracking-widest uppercase text-black transition-all"
            >
              Contact
            </button>
            <button 
               className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-2xl shadow-sm hover:shadow-md font-black text-xs tracking-widest uppercase text-white transition-all focus:outline-none"
            >
              Signaler
            </button>
          </div>
        </section>

        {/* GENERAL INFO (Read Only) */}
        <div className="px-5 md:px-12 lg:px-24 -mt-20 relative z-10 w-full shrink-0">
          <h2 className="text-[14px] font-black text-[#1e3b6a] mb-2 px-1 tracking-tight">Infos générales</h2>
          <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full -z-10"></div>
             
             <div className="space-y-1.5">
               <div className="text-[12px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Nationalité:</span> {conducteur.permis?.nationalite || "Congolaise"}
               </div>
               <div className="text-[12px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Date de naissance :</span> {conducteur.permis?.date_naissance || "N/A"}
               </div>
               <div className="text-[12px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Catégorie Permis :</span> {conducteur.categorie_permis || conducteur.permis?.categorie_permis || "N/A"}
               </div>
               <div className="text-[12px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Ville / Commune:</span> {conducteur.ville || "Kinshasa"} - {conducteur.commune || ""}
               </div>
               <div className="text-[12px] text-gray-700 font-medium leading-tight truncate">
                  <span className="font-bold text-gray-900">Adresse :</span> {conducteur.adresse || "N/A"}
               </div>
             </div>
          </div>
        </div>

        {/* EXPERIENCE BUTTON (Keep) */}
        <div className="px-5 md:px-12 lg:px-24 mt-5">
           <button className="w-full bg-[#f4b616] hover:bg-[#e6a800] text-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 font-bold tracking-wide">
              <History className="w-5 h-5 text-black" />
              <span className="text-sm">Expérience et casier</span>
           </button>
        </div>

        {/* FLEET SECTION */}
        <div className="flex-1 w-full flex flex-col mt-2">
           <h2 className="text-[14px] font-black text-gray-800 tracking-tight ml-5 md:ml-12 lg:ml-24 mt-5 mb-1 px-1">Flotte Actuelle</h2>
           <div className="w-full px-5 md:px-12 lg:px-24 pb-10 flex flex-col gap-4 mt-2">
             {vehicules.length === 0 ? (
               <div className="py-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center px-6">
                  <p className="text-sm font-bold text-gray-400">Aucun véhicule associé</p>
               </div>
             ) : (
               vehicules.map((v, idx) => (
                 <div key={v.id} className="w-full bg-white rounded-3xl p-3 sm:p-5 shadow-sm border border-gray-100 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 relative transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center p-1">
                       <img src={getUsageIllustration(v.usage_categorie || 'Privé')} alt={v.marque} className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex-1 flex flex-col min-w-[150px]">
                       <div className="flex items-center gap-2 flex-wrap">
                         <h4 className="font-black text-[#1e3b6a] text-sm sm:text-lg leading-none">{v.marque} <span className="text-gray-500 font-semibold">{v.modele}</span></h4>
                         <span className="text-[9px] sm:text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest leading-none whitespace-nowrap">
                           {v.plaque}
                         </span>
                       </div>
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


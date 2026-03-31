'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { conducteurService } from '@/services/conducteurs';
import { Vehicule, Conducteur } from '@/types';
import { getUsageIllustration } from '@/utils/vehicleUtils';
import { ShieldCheck, ShieldAlert, ChevronRight, FileText, X } from 'lucide-react';

export default function ScanVerificationPage() {
  const params = useParams();
  const rawId = params.id as string;
  const router = useRouter();

  const [driver, setDriver] = useState<Conducteur | null>(null);
  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCarteRose, setShowCarteRose] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!rawId || !rawId.includes('_')) {
          setIsLinked(false);
          setIsLoading(false);
          return;
        }

        const [driverId, vehiculeId] = rawId.split('_');

        const fetchedDriver = await conducteurService.getProfileByDriverId(driverId);
        const fetchedVehicule = await conducteurService.getVehiculeById(vehiculeId);

        if (fetchedDriver && fetchedVehicule) {
          setDriver(fetchedDriver);
          setVehicule(fetchedVehicule);
          
          const linked = await conducteurService.isVehiculeLinked(fetchedDriver.id, fetchedVehicule.id);
          setIsLinked(linked);
        } else {
          setIsLinked(false);
        }
      } catch (error) {
         console.error("Erreur scan:", error);
         setIsLinked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [rawId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3b6a]"></div>
        <p className="mt-4 text-[#1e3b6a] font-black animate-pulse">Vérification RoutiPass...</p>
      </div>
    );
  }

  // Erreur ou Non Lié
  if (!isLinked || !driver || !vehicule) {
    return (
      <main className="w-full min-h-screen bg-red-50 flex items-center justify-center p-6">
         <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-sm border border-red-100 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-red-600 mb-2">Accès Refusé</h1>
            <p className="text-gray-600 font-medium text-sm">
               Ce QR Code est invalide ou ce conducteur n'est pas autorisé à conduire ce véhicule.
            </p>
         </div>
      </main>
    );
  }

  const today = new Date();
  const vignetteOk = vehicule.date_expiration_vignette ? new Date(vehicule.date_expiration_vignette) >= today : false;
  const assOk = vehicule.date_expiration_assurance ? new Date(vehicule.date_expiration_assurance) >= today : false;
  const ctOk = vehicule.date_prochain_controle ? new Date(vehicule.date_prochain_controle) >= today : false;

  const toutValide = vignetteOk && assOk && ctOk;

  return (
    <main className="w-full min-h-screen bg-[#f8fbff] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
      
      {/* HEADER STATUS */}
      <div className={`pt-12 pb-24 px-6 md:px-12 lg:px-24 shrink-0 relative rounded-b-[2.5rem] transition-colors ${toutValide ? 'bg-green-500' : 'bg-red-500'}`}>
         <div className="flex flex-col items-center text-center mt-4 text-white">
            <ShieldCheck className="w-16 h-16 mb-4 opacity-90" />
            <h1 className="text-2xl font-black tracking-tight">{toutValide ? 'Contrôle Valide' : 'Alerte Fiscale'}</h1>
            <p className="text-white/80 font-medium mt-1 uppercase tracking-widest text-xs">Vérification Instantanée</p>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 px-5 md:px-12 lg:px-24 pb-24 relative z-10 -mt-12 space-y-6 max-w-2xl mx-auto w-full">
         
         {/* BLOC CONDUCTEUR */}
         <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex items-center gap-4 relative">
            <img src={driver.photo || '/avatar-placeholder.png'} alt={driver.nom} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
            <div className="flex-1 min-w-0">
               <h3 className="font-black text-[#1e3b6a] text-lg truncate leading-none mb-1">{driver.prenom} {driver.nom}</h3>
               <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-widest">
                  Permis: {driver.permis?.categorie_permis || 'Inconnu'}
               </span>
            </div>
            <button 
               onClick={() => router.push(`/conducteur-public/${driver.driver_id}`)}
               className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
            >
               <ChevronRight className="w-5 h-5" />
            </button>
         </div>

         {/* BLOC VEHICULE & STATUT FISCAL */}
         <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col items-center relative">
            <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-[#f8fbff] rounded-full p-2 mb-4 -mt-12 shadow-sm border-4 border-white">
               <img src={getUsageIllustration(vehicule.usage_categorie || 'Privé')} alt={vehicule.marque} className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            
            <div className="text-center w-full">
               <span className="inline-block bg-blue-50 text-blue-600 font-black text-2xl tracking-widest px-6 py-2 rounded-xl mb-2 border border-blue-100 shadow-inner">
                  {vehicule.plaque}
               </span>
               <h2 className="text-xl font-bold text-[#1e3b6a] leading-tight">{vehicule.marque} <span className="font-medium text-gray-500">{vehicule.modele}</span></h2>
               <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{vehicule.usage_categorie}</p>
            </div>

            {/* STATUS FISCAL TEMPS REEL */}
            <div className="w-full grid gap-3 mt-8">
               <div className={`p-4 rounded-2xl flex items-center justify-between border ${assOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <span className={`font-black text-sm uppercase tracking-widest ${assOk ? 'text-green-700' : 'text-red-700'}`}>Assurance</span>
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${assOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {assOk ? 'VALIDE' : 'EXPIRÉ'}
                  </div>
               </div>

               <div className={`p-4 rounded-2xl flex items-center justify-between border ${ctOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <span className={`font-black text-sm uppercase tracking-widest ${ctOk ? 'text-green-700' : 'text-red-700'}`}>Contrôle Tech.</span>
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${ctOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {ctOk ? 'VALIDE' : 'EXPIRÉ'}
                  </div>
               </div>

               <div className={`p-4 rounded-2xl flex items-center justify-between border ${vignetteOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <span className={`font-black text-sm uppercase tracking-widest ${vignetteOk ? 'text-green-700' : 'text-red-700'}`}>Vignette</span>
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${vignetteOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {vignetteOk ? 'VALIDE' : 'EXPIRÉ'}
                  </div>
               </div>
            </div>

            {/* CARTE ROSE BUTTON */}
            <button 
               onClick={() => setShowCarteRose(true)}
               className="w-full mt-6 bg-[#1e3b6a] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#152a4f] shadow-lg transition-transform hover:-translate-y-1"
            >
               <FileText className="w-5 h-5" /> Vérifier Carte Rose
            </button>

            {/* SUBMIT FINE BUTTON */}
            <button 
               onClick={() => router.push(`/dashboard-agent/amende?driver_id=${driver.id}&vehicule_id=${vehicule.id}`)}
               className="w-full mt-4 bg-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-transform hover:-translate-y-1"
            >
               <ShieldAlert className="w-5 h-5" /> Soumettre une amende
            </button>
         </div>
      </div>

      {/* CARTE ROSE MODAL */}
      {showCarteRose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1e3b6a]/80 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
           <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
              
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#f8fbff]">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                       <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#1e3b6a] text-lg leading-tight">Carte Rose</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Données Administratives</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCarteRose(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-white">
                 <div className="space-y-5">
                    
                    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plaque d'Immatriculation</span>
                       <span className="font-black text-[#1e3b6a] text-lg mt-0.5">{vehicule.plaque}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">N° de Châssis</span>
                          <span className="font-bold text-gray-900 text-sm mt-0.5 break-all">{vehicule.chassis_no || 'Non renseigné'}</span>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Énergie</span>
                          <span className="font-bold text-gray-900 text-sm mt-0.5">{vehicule.energie || 'N/A'}</span>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Puissance</span>
                          <span className="font-bold text-gray-900 text-sm mt-0.5">{vehicule.puissance ? `${vehicule.puissance}` : 'N/A'}</span>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poids Total (PTAC)</span>
                          <span className="font-bold text-gray-900 text-sm mt-0.5">{vehicule.ptac || 'Non renseigné'}</span>
                       </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5 mt-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Propriétaire Enregistré</span>
                       <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col">
                          <span className="font-black text-[#1e3b6a] text-base">{vehicule.nom_proprietaire || 'Non spécifié'}</span>
                          <span className="text-xs font-bold text-blue-600 mt-1">{vehicule.phone_proprietaire || 'Téléphone non renseigné'}</span>
                          <span className="text-xs text-gray-600 font-medium mt-1">{vehicule.adresse_proprietaire || 'Adresse inconnue'}</span>
                       </div>
                    </div>

                 </div>
              </div>
           </div>
        </div>
      )}

    </main>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { conducteurService } from '@/services/conducteurs';
import { Vehicule, Conducteur } from '@/types';
import { getUsageIllustration, getValidityStatus } from '@/utils/vehicleUtils';
import { ShieldCheck, ShieldAlert, ChevronRight, FileText, X, House, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ScanVerificationPage() {
  const params = useParams();
  const rawId = params.id as string;
  const router = useRouter();

  const [driver, setDriver] = useState<Conducteur | null>(null);
  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCarteRose, setShowCarteRose] = useState(false);
  const [unpaidFines, setUnpaidFines] = useState<any[]>([]);
  const [selectedAmende, setSelectedAmende] = useState<any | null>(null);

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

          const fines = await conducteurService.getFinesIssued(fetchedDriver.id, [fetchedVehicule.id]);
          setUnpaidFines(fines.filter((f: any) => f.statut === 'IMPAYÉE'));
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
  today.setHours(0, 0, 0, 0);

  const getDaysDiff = (dateStr: string | null) => {
    if (!dateStr) return -999;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const assDays = getDaysDiff(vehicule.date_expiration_assurance);
  const ctDays = getDaysDiff(vehicule.date_prochain_controle);
  const vigDays = getDaysDiff(vehicule.date_expiration_vignette);

  const isFiscalExpired = assDays < 0 || ctDays < 0 || vigDays < 0;
  const isFiscalWarning = !isFiscalExpired && (assDays <= 2 || ctDays <= 2 || vigDays <= 2);
  const hasFiscalIssue = isFiscalExpired || isFiscalWarning;

  const amendeStatusList = unpaidFines.map(amende => {
     const dateEm = amende.date_emission ? new Date(amende.date_emission) : new Date();
     const delai = amende.fine_types?.delai_paiement ?? 30;
     const expirationDate = new Date(dateEm);
     expirationDate.setDate(expirationDate.getDate() + delai);
     expirationDate.setHours(0, 0, 0, 0);
     return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  });

  const worstFineDays = amendeStatusList.length > 0 ? Math.min(...amendeStatusList) : Infinity;
  const isFineExpired = worstFineDays <= 0;
  const isFineWarning = worstFineDays > 0 && worstFineDays <= 2;
  const hasFineIssue = isFineExpired || isFineWarning;

  let headerColor = 'bg-emerald-500 shadow-emerald-100';
  let statusIcon = <ShieldCheck className="w-20 h-20 mb-4 animate-in zoom-in duration-500" />;
  let statusContent = <h1 className="text-3xl font-black tracking-tight">✅ CONDUCTEUR EN RÈGLE</h1>;

  if (hasFiscalIssue && hasFineIssue) {
     headerColor = 'bg-rose-600 shadow-rose-100';
     statusIcon = <ShieldAlert className="w-20 h-20 mb-4 animate-bounce" />;
     statusContent = (
        <div className="w-full max-w-[280px] md:max-w-md mx-auto overflow-hidden relative">
           <div className="flex w-max animate-marquee-scrolling">
               <div className="flex gap-8 px-4 items-center">
                   <span className="text-xl md:text-2xl font-black tracking-tight">💰 RETARD FISCAL CONSTATÉ</span>
                   <span className="text-white/50">•••</span>
                   <span className="text-xl md:text-2xl font-black tracking-tight">🚨 DÉPASSEMENT CRITIQUE AMENDE</span>
                   <span className="text-white/50">•••</span>
               </div>
               <div className="flex gap-8 px-4 items-center">
                   <span className="text-xl md:text-2xl font-black tracking-tight">💰 RETARD FISCAL CONSTATÉ</span>
                   <span className="text-white/50">•••</span>
                   <span className="text-xl md:text-2xl font-black tracking-tight">🚨 DÉPASSEMENT CRITIQUE AMENDE</span>
                   <span className="text-white/50">•••</span>
               </div>
           </div>
        </div>
     );
  } else if (isFiscalExpired || isFineExpired) {
     headerColor = 'bg-rose-600 shadow-rose-100';
     statusIcon = <ShieldAlert className="w-20 h-20 mb-4 animate-bounce" />;
     statusContent = <h1 className="text-3xl font-black tracking-tight">{isFiscalExpired ? 'Infraction Fiscale' : 'Infraction Amende'}</h1>;
  } else if (isFiscalWarning || isFineWarning) {
     headerColor = 'bg-amber-500 shadow-amber-100';
     statusIcon = <ShieldAlert className="w-20 h-20 mb-4 animate-pulse" />;
     statusContent = <h1 className="text-3xl font-black tracking-tight">Avertissement</h1>;
  }

  const assOk = assDays >= 0;
  const ctOk = ctDays >= 0;
  const vignetteOk = vigDays >= 0;

  return (
    <main className="w-full min-h-screen bg-[#f8fbff] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
      
      <style>{`
        @keyframes custom-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scrolling {
          animation: custom-marquee 12s linear infinite;
        }
      `}</style>

      {/* NAV TOP */}
      <div className="absolute top-6 left-6 z-50">
         <button 
            onClick={() => router.push('/dashboard-agent')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-bold text-xs transition-all border border-white/20"
         >
            <ArrowLeft className="w-4 h-4" /> Retour
         </button>
      </div>

      {/* HEADER STATUS */}
      <div className={`pt-12 pb-24 px-6 md:px-12 lg:px-24 shrink-0 relative rounded-b-[3rem] transition-all duration-700 shadow-xl ${headerColor}`}>
         <div className="flex flex-col items-center text-center mt-4 text-white">
            {statusIcon}
            {statusContent}
            <p className="text-white/80 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">Statut Temps Réel</p>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 px-5 md:px-12 lg:px-24 pb-24 relative z-10 -mt-12 space-y-6 max-w-2xl mx-auto w-full">
         
         {/* BLOC CONDUCTEUR */}
         <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex items-center gap-4 relative">
            <img src={driver.permis?.photo || driver.photo || '/avatar-placeholder.png'} alt={driver.permis?.nom || driver.nom} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
            <div className="flex-1 min-w-0">
               <h3 className="font-black text-[#1e3b6a] text-lg truncate leading-none mb-1 uppercase">
                  {driver.permis?.prenom || driver.prenom} {driver.permis?.nom || driver.nom}
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-widest">
                     Permis {driver.permis?.categorie_permis || '??'}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tight">
                     N° {driver.permis?.numero_permis || 'Inconnu'}
                  </span>
               </div>
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
               {[
                  { label: 'Assurance', date: vehicule.date_expiration_assurance },
                  { label: 'Contrôle Tech.', date: vehicule.date_prochain_controle },
                  { label: 'Vignette', date: vehicule.date_expiration_vignette }
               ].map((doc, idx) => {
                  const status = getValidityStatus(doc.date);
                  return (
                     <div key={idx} className="p-4 rounded-2xl flex items-center justify-between border transition-all duration-300" style={{ backgroundColor: status.bg, borderColor: status.border }}>
                        <span className="font-black text-sm uppercase tracking-widest" style={{ color: status.text }}>{doc.label}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold opacity-60" style={{ color: status.text }}>
                              {doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : '--/--/----'}
                           </span>
                           <div className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm" style={{ backgroundColor: status.badge, color: status.text }}>
                              {status.label}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* CARTE ROSE BUTTON */}
            <button 
               onClick={() => setShowCarteRose(true)}
               className="w-full mt-6 bg-[#1e3b6a] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#152a4f] shadow-lg transition-transform hover:-translate-y-1"
            >
               <FileText className="w-5 h-5" /> Vérifier Carte Rose
            </button>
         </div>

         {/* BLOC AMENDES IMPAYEES */}
         {unpaidFines.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col relative w-full">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                     <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1e3b6a] text-lg leading-tight uppercase tracking-tight">Amendes Impayées</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{unpaidFines.length} infraction(s) en attente</p>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4">
                  {unpaidFines.map((amende) => {
                     const dateEm = amende.date_emission ? new Date(amende.date_emission) : new Date();
                     const delai = amende.fine_types?.delai_paiement ?? 30; // 30 is default fallback if null
                     const expirationDate = new Date(dateEm);
                     expirationDate.setDate(expirationDate.getDate() + delai);
                     expirationDate.setHours(0, 0, 0, 0);
                     const tdiff = expirationDate.getTime() - today.getTime();
                     const daysDiff = Math.ceil(tdiff / (1000 * 60 * 60 * 24));
                     
                     let colorClasses = "bg-green-50 border-green-200";
                     let textClasses = "text-green-700";
                     let statusText = `✅ ${daysDiff} jours restants`;
                     let dotColor = "bg-green-500";
                     let isCritical = false;

                     if (daysDiff <= 0) {
                        colorClasses = "bg-red-50 border-red-200 shadow-red-100 shadow-md animate-pulse";
                        textClasses = "text-red-700";
                        statusText = `⚠️ DÉPASSEMENT CRITIQUE : ${Math.abs(daysDiff)} jours de retard`;
                        dotColor = "bg-red-600 animate-ping";
                        isCritical = true;
                     } else if (daysDiff <= 2) {
                        colorClasses = "bg-amber-50 border-amber-200";
                        textClasses = "text-amber-700";
                        statusText = `⚠️ ${daysDiff} jours restants`;
                        dotColor = "bg-amber-500";
                     }

                     const displayNature = amende.fine_types?.name || amende.nature_infraction || amende.motif || "Infraction non spécifiée";

                     return (
                        <div key={amende.id} className={`p-5 rounded-2xl border flex flex-col gap-3 relative transition-all shadow-sm ${colorClasses}`}>
                           <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-black text-sm text-[#1e3b6a] uppercase tracking-wide leading-tight truncate">
                                    {displayNature}
                                 </h4>
                                 <div className={`text-xl font-black mt-1 tracking-tight ${textClasses}`}>
                                    {(amende.montant || 0).toLocaleString()} {amende.devise || "CDF"}
                                 </div>
                              </div>
                              <button 
                                 onClick={() => setSelectedAmende(amende)}
                                 className="px-4 py-2 bg-white hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-gray-100 transition-colors text-black shrink-0"
                              >
                                 Détails
                              </button>
                           </div>
                           <div className="flex items-center gap-2 mt-1 bg-white/50 p-2 rounded-xl border border-black/5">
                              <div className="w-2.5 h-2.5 rounded-full flex shrink-0 items-center justify-center relative ml-1">
                                 <div className={`absolute w-full h-full rounded-full ${dotColor} ${isCritical ? '' : 'opacity-80'}`}></div>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-red-600' : textClasses}`}>
                                 {statusText}
                              </span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col items-center relative">

            {/* SUBMIT FINE BUTTON */}
            <button 
               onClick={() => router.push(`/dashboard-agent/amende?driver_id=${driver.id}&vehicule_id=${vehicule.id}`)}
               className="w-full mt-4 bg-rose-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-transform hover:-translate-y-1"
            >
               <ShieldAlert className="w-5 h-5" /> Soumettre une amende
            </button>

            {/* BACK TO DASHBOARD BUTTON */}
            <button 
               onClick={() => router.push('/dashboard-agent')}
               className="w-full mt-8 bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
               <House className="w-5 h-5" /> Terminer la vérification
            </button>
         </div>
      </div>

      {/* AMENDE DETAILS MODAL */}
      {selectedAmende && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1e3b6a]/80 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
           <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
              
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#f8fbff]">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                       <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#1e3b6a] text-lg leading-tight uppercase">Détails Infraction</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Base de données de Police</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedAmende(null)} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
                 {/* Nature */}
                 <div className="bg-gray-50 p-4 rounded-2xl flex col-span-full flex-col text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nature de l'infraction</span>
                    <span className="font-black text-[#1e3b6a] text-lg mt-0.5">{selectedAmende.fine_types?.name || selectedAmende.nature_infraction || selectedAmende.motif || "Non spécifiée"}</span>
                 </div>

                 {/* Montant & Date */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center border p-2 border-red-100">
                       <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Montant</span>
                       <span className="font-black text-red-600 text-lg mt-0.5">{(selectedAmende.montant || 0).toLocaleString()} {selectedAmende.devise || "CDF"}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Heure</span>
                       <span className="font-bold text-gray-900 text-[11px] mt-1 leading-tight">
                         {selectedAmende.date_emission ? new Date(selectedAmende.date_emission).toLocaleString('fr-FR', {
                           day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                         }) : 'Inconnue'}
                       </span>
                    </div>
                 </div>
                 
                 {/* Lieu (si dispo) */}
                 {selectedAmende.lieu && (
                    <div className="bg-gray-50 p-4 rounded-2xl flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lieu de l'infraction</span>
                       <span className="font-bold text-gray-800 text-sm">{selectedAmende.lieu}</span>
                    </div>
                 )}

                 {/* Note */}
                 <div className="bg-blue-50 p-4 rounded-2xl flex flex-col border border-blue-100">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <FileText className="w-3 h-3" /> Rapport de l'agent
                    </span>
                    <p className="font-medium text-blue-900 text-sm leading-relaxed italic">
                      "{selectedAmende.remarques || 'Aucune observation supplémentaire renseignée par l\'agent verbalisateur.'}"
                    </p>
                 </div>

                 {/* Photo */}
                 {selectedAmende.photo_url && (
                    <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm relative mt-2">
                       <img src={selectedAmende.photo_url} alt="Preuve de l'infraction" className="w-full h-auto object-cover" />
                       <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded backdrop-blur-sm">
                         Preuve Photo
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

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

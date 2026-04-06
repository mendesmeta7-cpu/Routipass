'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conducteurService } from '@/services/conducteurs';
import { Vehicule, Conducteur } from '@/types';
import { getUsageIllustration, getValidityStatus, getCountdownStatus } from '@/utils/vehicleUtils';
import { ChevronLeft, ChevronRight, QrCode, Download, Trash2, Users, FileText, Settings, ShieldCheck, AlertTriangle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { authService } from '@/services/auth';

export default function FicheVehiculePage() {
  const router = useRouter();
  const params = useParams();
  const vehiculeId = params.id as string;

  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profilsAssocies, setProfilsAssocies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');
  
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.push('/connexion-conducteur');
          return;
        }
        setCurrentUser(user);
        
        // Ensure we retrieve the ACTUAL driver profile ID even if logged in via Auth
        let driverIdStr = user.id;
        if (user.user_metadata?.role === 'DRIVER' && user.user_metadata?.driver_id) {
          const dData = await conducteurService.getProfileByDriverId(user.user_metadata.driver_id);
          if (dData) driverIdStr = dData.id;
        } else if ((user as any).role === 'DRIVER') {
          driverIdStr = user.id; // from localStorage
        }

        const vData = await conducteurService.getVehiculeById(vehiculeId);
        if (vData) {
          setVehicule(vData);
          try {
             const profils = await conducteurService.getProfilsAssocies(vehiculeId, driverIdStr);
             setProfilsAssocies(profils);
          } catch(err: any) {
             setDebugMsg(err.message || 'Error loading profiles');
          }
        } else {
          router.push('/dashboard-conducteur');
        }
      } catch (error) {
        console.error("Error loading vehicle details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [vehiculeId, router]);

  const handleDissocier = async () => {
    if (!currentUser || !vehicule) return;
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir dissocier ce véhicule de votre compte ?");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await conducteurService.dissocierVehicule(currentUser.id, vehicule.id);
      router.push('/dashboard-conducteur');
    } catch (error) {
      console.error("Erreur lors de la dissociation:", error);
      alert("Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qrCodeEl");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Adding padding to the downloaded QR code
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${vehicule?.plaque}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3b6a]"></div>
      </div>
    );
  }

  if (!vehicule || !currentUser) return null;

  const qrValue = `${currentUser.user_metadata?.driver_id || currentUser.driver_id}_${vehicule.id}`;

  const assStatus = getValidityStatus(vehicule.date_expiration_assurance);
  const ctStatus = getValidityStatus(vehicule.date_prochain_controle);
  const ctCountdown = getCountdownStatus(vehicule.date_prochain_controle);
  const vigStatus = getValidityStatus(vehicule.date_expiration_vignette);

  return (
    <main className="w-full min-h-screen bg-[#f8fbff] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
      
      {/* HEADER */}
      <div className="bg-[#e9b11e] pt-12 pb-32 px-6 md:px-12 lg:px-24 shrink-0 relative rounded-b-[2.5rem]">
         <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="bg-white/30 p-2 rounded-full hover:bg-white/50 transition">
              <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <h1 className="text-xl font-black text-black tracking-tight flex-1 truncate">Fiche Véhicule</h1>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 px-5 md:px-12 lg:px-24 pb-24 relative z-10 -mt-24">
         
         {/* Main Vehicle Card */}
         <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col items-center mb-6 relative mt-16 pt-0">
            <div className="w-48 h-48 -mt-20 shrink-0 flex items-center justify-center rounded-t-[2rem] overflow-hidden bg-white">
               <img src={getUsageIllustration(vehicule.usage_categorie || 'Privé')} alt={vehicule.marque} className="w-full h-full object-contain" />
            </div>
            
            <div className="mt-2 text-center w-full flex flex-col items-center">
               <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl mb-2 border border-blue-100">
                  <img src="https://flagcdn.com/w40/cd.png" alt="RDC" className="w-[22px] h-[16px] object-cover rounded-[3px] shadow-sm ring-1 ring-black/10" />
                  <span className="text-blue-600 font-black text-2xl tracking-widest leading-none">
                     {vehicule.plaque}
                  </span>
               </div>
               <h2 className="text-xl font-bold text-[#1e3b6a]">{vehicule.marque} <span className="font-medium text-gray-500">{vehicule.modele}</span></h2>
               <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{vehicule.usage_categorie}</p>
            </div>

            <div className="flex items-center gap-3 mt-6 w-full">
               <button 
                 onClick={() => setShowQrModal(true)}
                 className="flex-1 bg-[#1e3b6a] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-[#152a4f] transition-colors"
               >
                  <QrCode className="w-5 h-5" />
                  Générer QR Code
               </button>
            </div>
         </div>

         {/* Co-conducteurs */}
         <div className="mb-6">
            <h3 className="text-sm font-black text-gray-800 tracking-tight mb-3 px-1 flex items-center gap-2">
               <Users className="w-4 h-4 text-gray-500" /> Conducteurs Associés
            </h3>
            {debugMsg && <p className="text-red-500 text-xs mb-2">Debug: {debugMsg}</p>}
            {profilsAssocies.length > 0 ? (
               <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                  {profilsAssocies.map((profil) => (
                     <div key={profil.id} className="flex flex-col p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                           <img src={profil.photo || '/avatar-placeholder.png'} alt={profil.nom} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                           <div className="flex flex-col flex-1">
                              <span className="font-bold text-[#1e3b6a] text-sm">{profil.prenom} {profil.nom}</span>
                              <span className="text-xs text-gray-500 font-medium">{profil.postnom}</span>
                           </div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#0b5cff] mt-2 self-start ml-[52px] flex items-center gap-1 hover:text-blue-800 transition-colors">
                           Voir plus <ChevronRight className="w-3 h-3" />
                        </button>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                     <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Vous êtes le seul conducteur enregistré<br/>pour ce véhicule.</p>
               </div>
            )}
         </div>

         {/* Statut Fiscal */}
         <div className="mb-6">
            <h3 className="text-sm font-black text-gray-800 tracking-tight mb-3 px-1 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-gray-500" /> Statut Fiscal
            </h3>
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
               <div className="p-3.5 rounded-2xl flex items-center justify-between border transition-all duration-300" style={{ backgroundColor: assStatus.bg, borderColor: assStatus.border }}>
                  <span className="font-black text-sm uppercase tracking-widest" style={{ color: assStatus.text }}>Assurance</span>
                  <div className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm" style={{ backgroundColor: assStatus.badge, color: assStatus.text }}>
                     {assStatus.label}
                  </div>
               </div>
               <div className="p-3.5 rounded-2xl flex flex-col gap-2 border transition-all duration-300 shadow-sm" style={{ backgroundColor: ctCountdown.bg, borderColor: ctCountdown.border }}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm uppercase tracking-widest" style={{ color: ctCountdown.text }}>Contrôle Tech.</span>
                    <div className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm" style={{ backgroundColor: ctCountdown.color, color: 'white' }}>
                      {ctCountdown.label}
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: ctCountdown.status === 'expired' ? '100%' : `${Math.min(100, Math.max(5, (ctCountdown.days / 365) * 100))}%`,
                        backgroundColor: ctCountdown.color 
                      }}
                    ></div>
                  </div>
               </div>
               <div className="p-3.5 rounded-2xl flex items-center justify-between border transition-all duration-300" style={{ backgroundColor: vigStatus.bg, borderColor: vigStatus.border }}>
                  <span className="font-black text-sm uppercase tracking-widest" style={{ color: vigStatus.text }}>Vignette</span>
                  <div className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm" style={{ backgroundColor: vigStatus.badge, color: vigStatus.text }}>
                     {vigStatus.label}
                  </div>
               </div>
            </div>
         </div>

         {/* Admin Data (Carte Rose) */}
         <div className="mb-6">
            <h3 className="text-sm font-black text-gray-800 tracking-tight mb-3 px-1 flex items-center gap-2">
               <FileText className="w-4 h-4 text-gray-500" /> Données Administratives
            </h3>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
               
               <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Numéro de Châssis</span>
                     <span className="font-semibold text-gray-900 text-sm mt-0.5">{vehicule.chassis_no || 'Non renseigné'}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Énergie / Puissance</span>
                     <span className="font-semibold text-gray-900 text-sm mt-0.5">{vehicule.energie || 'N/A'} - {vehicule.puissance ? `${vehicule.puissance}` : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PTAC (Charge)</span>
                     <span className="font-semibold text-gray-900 text-sm mt-0.5">{vehicule.ptac || 'Non renseigné'}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Année / Modèle</span>
                     <span className="font-semibold text-gray-900 text-sm mt-0.5">{vehicule.annee ? vehicule.annee : 'N/A'}</span>
                  </div>
               </div>

               <div className="border-t border-gray-100 pt-4 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Propriétaire Enregistré</span>
                  <div className="flex flex-col">
                     <span className="font-bold text-[#1e3b6a]">{vehicule.nom_proprietaire || 'Non spécifié'}</span>
                     <span className="text-xs text-gray-500">{vehicule.adresse_proprietaire || 'Adresse inconnue'}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Actions */}
         <div className="mt-8">
            <button 
               onClick={handleDissocier}
               disabled={isDeleting}
               className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-4 rounded-2xl flex justify-center items-center gap-2 font-bold transition-colors disabled:opacity-50"
            >
               <Trash2 className="w-5 h-5" />
               {isDeleting ? 'Suppression...' : 'Supprimer le véhicule'}
            </button>
         </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e3b6a]/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                       <QrCode className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-black text-[#1e3b6a] text-lg">QR Associé</h3>
                 </div>
                 <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 p-2 rounded-full">
                    ✕
                 </button>
              </div>
              
              <div className="p-8 flex flex-col items-center justify-center bg-[#f8fbff]">
                 <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100" ref={qrRef}>
                    <QRCode
                      id="qrCodeEl"
                      value={qrValue}
                      size={200}
                      level={"M"}
                      bgColor={"#ffffff"}
                      fgColor={"#1e3b6a"}
                    />
                 </div>
                 <p className="text-xs text-center text-gray-500 font-medium mt-6 leading-relaxed px-4">
                    Ce QR code atteste que vous êtes habilité à conduire ce véhicule. Présentez-le en cas de contrôle.
                 </p>
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                 <button 
                    onClick={downloadQR}
                    className="w-full bg-[#1e3b6a] text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#152a4f] shadow-md transition-colors"
                 >
                    <Download className="w-4 h-4" /> Télécharger
                 </button>
              </div>
           </div>
        </div>
      )}

    </main>
  );
}

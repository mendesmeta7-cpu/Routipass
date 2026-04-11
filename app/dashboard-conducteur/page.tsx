"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { LogOut, Car, FileText, CheckCircle2, XCircle, Loader2, Search, ArrowDown, Bell, Edit, Phone, FileSignature, AlertCircle, ScanLine, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { conducteurService } from "@/services/conducteurs";
import { Conducteur, Vehicule, Amende } from "@/types";
import { VehiclePreviewModal } from "@/components/VehiclePreviewModal";
import { SuccessToast } from "@/components/ui/toast";
import { getUsageIllustration, getValidityStatus } from "@/utils/vehicleUtils";
import { supabase } from "@/lib/supabaseClient"; // For real-time

// Interface for a vehicle combined with its associated drivers' photos
interface VehiculeWithPhotos extends Vehicule {
  photosAssociees: string[];
}

export default function DashboardConducteur() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [plaque, setPlaque] = useState("");

  const [conducteur, setConducteur] = useState<Conducteur | null>(null);
  const [vehicules, setVehicules] = useState<VehiculeWithPhotos[]>([]);
  const [amendes, setAmendes] = useState<Amende[]>([]);

  const [vehiculeRecherche, setVehiculeRecherche] = useState<Vehicule | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorLink, setErrorLink] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Opération réussie !");
  const [showContactModal, setShowContactModal] = useState(false);
  const [updatingContact, setUpdatingContact] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [hasAlerts, setHasAlerts] = useState(false);
  const [alertsArray, setAlertsArray] = useState<string[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // Notifications State
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellWiggling, setIsBellWiggling] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentUnpaidFines, setRecentUnpaidFines] = useState<Amende[]>([]);
  const [showNewFineToast, setShowNewFineToast] = useState(false);

  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  useEffect(() => {
    if (alertsArray.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % alertsArray.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [alertsArray]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const profile = await conducteurService.getProfileById(user.id);
        if (!profile) {
          router.push("/login");
          return;
        }

        // Add correct permit data fallback if needed
        const conducteurData = {
          ...profile,
          nom: profile.nom || profile.permis?.nom,
          prenom: profile.prenom || profile.permis?.prenom,
          photo: profile.photo || profile.permis?.photo,
          categorie_permis: profile.categorie_permis || profile.permis?.categorie_permis
        };

        setConducteur(conducteurData);

        const [userVehicules, userAmendes] = await Promise.all([
          conducteurService.getVehicules(profile.id),
          conducteurService.getFinesIssued(profile.id)
        ]);

        // Load associated photos for each vehicle
        const vehiclesWithPhotos: VehiculeWithPhotos[] = await Promise.all(
          userVehicules.map(async (v) => {
            const photos = await conducteurService.getConducteursAssocies(v.id, profile.id);
            return { ...v, photosAssociees: photos };
          })
        );

        setVehicules(vehiclesWithPhotos);
        setAmendes(userAmendes);

        // Notifications initialization
        const unpaid = userAmendes.filter(a => a.statut !== 'PAYEE');
        setUnreadCount(unpaid.length);
        setRecentUnpaidFines(unpaid.slice(0, 5));

        // Evaluate simple business rules for Account Status
        evaluateAccountHealth(userAmendes, vehiclesWithPhotos);

        // Setup real-time
        setupRealtime(profile.id, vehiclesWithPhotos);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
       if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
       }
    };
  }, [router]);

  const setupRealtime = (profileId: string, vehicles: VehiculeWithPhotos[]) => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    let channel = supabase.channel(`fines-${profileId}-${Date.now()}`);

    // Driver fines
    channel = channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fines_issued', filter: `conducteur_id=eq.${profileId}` }, payload => {
        console.log("🔔 Nouvelle amende conducteur détectée !", payload);
        handleNewFine(payload.new as Amende);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fines_issued', filter: `conducteur_id=eq.${profileId}` }, payload => {
        handleUpdateFine(payload.new as Amende);
      });

    // Vehicle fines
    vehicles.forEach(v => {
      channel = channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fines_issued', filter: `vehicule_id=eq.${v.id}` }, payload => {
           if (!payload.new.conducteur_id) handleNewFine(payload.new as Amende);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fines_issued', filter: `vehicule_id=eq.${v.id}` }, payload => {
           if (!payload.new.conducteur_id) handleUpdateFine(payload.new as Amende);
        });
    });

    channel.subscribe();
    setRealtimeChannel(channel);
  };

  const handleNewFine = (fine: Amende) => {
    setUnreadCount(prev => prev + 1);
    setRecentUnpaidFines(prev => [fine, ...prev].slice(0, 5));
    setIsBellWiggling(true);
    setShowNewFineToast(true);
    playBip();

    // Reset wiggle state for next time
    setTimeout(() => setIsBellWiggling(false), 1000);
    // Hide toast after 5 seconds
    setTimeout(() => setShowNewFineToast(false), 5000);
  };

  const handleUpdateFine = (fine: Amende) => {
    // Si l'amende est marquée comme payée, on la retire de la liste des notifications
    if (fine.statut === 'PAYEE') {
      setRecentUnpaidFines(prev => prev.filter(f => f.id !== fine.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Si le toast affichait cette amende, on le cache
      if (recentUnpaidFines[0]?.id === fine.id) {
        setShowNewFineToast(false);
      }
    }
  };

  const playBip = () => {
    try {
      const audio = new Audio('/sounds/notification.m4a');
      audio.play().catch(e => console.warn("Audio play failed - user interaction might be required", e));
    } catch (err) {
      console.warn("Could not play notification sound", err);
    }
  };

  const openContactModal = () => {
    setNewEmail(conducteur?.email || "");
    setNewPhone(conducteur?.telephone || "");
    setShowContactModal(true);
  };

  const handleUpdateContact = async () => {
    if (!conducteur) return;
    setUpdatingContact(true);
    try {
      await conducteurService.updateProfile(conducteur.id, { 
        email: newEmail, 
        telephone: newPhone 
      });
      setConducteur({ ...conducteur, email: newEmail, telephone: newPhone });
      setShowContactModal(false);
      setToastMessage("Contacts mis à jour !");
      setShowToast(true);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingContact(false);
    }
  };

  const evaluateAccountHealth = (amendesList: Amende[], vehiculesList: VehiculeWithPhotos[]) => {
    const unpaidAmendes = amendesList.filter(a => a.statut !== 'PAYEE');
    const alerts: string[] = [];

    const unpaidDriver = unpaidAmendes.filter(a => a.conducteur_id);
    const unpaidVehicle = unpaidAmendes.filter(a => !a.conducteur_id);

    if (unpaidDriver.length > 0) {
      alerts.push(`${unpaidDriver.length} amende(s) impayée(s) (Conducteur)`);
    }

    const groupedVehicles: Record<string, number> = {};
    unpaidVehicle.forEach(a => {
       const v = vehiculesList.find(veh => veh.id === a.vehicule_id);
       if (v) {
          groupedVehicles[v.plaque] = (groupedVehicles[v.plaque] || 0) + 1;
       }
    });

    Object.entries(groupedVehicles).forEach(([plaque, count]) => {
       alerts.push(`${count} amende(s) impayée(s) (Véhicule ${plaque})`);
    });

    const today = new Date();

    for (const v of vehiculesList) {
      if (v.date_expiration_vignette && new Date(v.date_expiration_vignette) < today) {
        alerts.push(`Vignette exp. (${v.plaque})`);
      }
      if (v.date_expiration_assurance && new Date(v.date_expiration_assurance) < today) {
        alerts.push(`Assurance exp. (${v.plaque})`);
      }
      if (v.date_prochain_controle && new Date(v.date_prochain_controle) < today) {
        alerts.push(`Contrôle Tech. exp. (${v.plaque})`);
      }
    }

    if (alerts.length > 0) {
      setHasAlerts(true);
      setAlertsArray(alerts);
    } else {
      setHasAlerts(false);
      if (vehiculesList.length === 0) {
        setAlertsArray(["Aucun véhicule lié. Ajoutez-en un."]);
      } else {
        setAlertsArray(["Tout est en règle."]);
      }
    }
  };

  useEffect(() => {
    if (plaque.length >= 7) {
      handleSearch();
    }
  }, [plaque]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!plaque || loadingSearch) return;

    setLoadingSearch(true);
    try {
      const v = await conducteurService.findVehiculeByPlaque(plaque);
      if (v) {
        setVehiculeRecherche(v);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const lierVehicule = async () => {
    if (!conducteur || !vehiculeRecherche) return;
    setLoadingSearch(true);
    setErrorLink("");
    try {
      await conducteurService.lierVehicule(conducteur.id, vehiculeRecherche.id);

      const vphotos: VehiculeWithPhotos = { ...vehiculeRecherche, photosAssociees: [] };
      const newVehiclesList = [...vehicules, vphotos];
      setVehicules(newVehiclesList);

      // Fetch dynamic fines including the new vehicle
      const newFines = await conducteurService.getFinesIssued(conducteur.id, newVehiclesList.map(v => v.id));
      setAmendes(newFines);
      
      const unpaid = newFines.filter(a => a.statut !== 'PAYEE');
      setUnreadCount(unpaid.length);
      setRecentUnpaidFines(unpaid.slice(0, 5));

      evaluateAccountHealth(newFines, newVehiclesList);
      setupRealtime(conducteur.id, newVehiclesList);

      setVehiculeRecherche(null);
      setShowPreview(false);
      setPlaque("");
      setToastMessage("Véhicule associé avec succès !");
      setShowToast(true);
    } catch (error: any) {
      console.error(error);
      setErrorLink(error.message || "Erreur lors de la liaison du véhicule.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const logout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!conducteur) return null;

  return (
    <div className="min-h-screen bg-[#F0F9FF] md:p-8 flex items-center justify-center font-sans">
      {/* CSS Animation defined globally for the silhouette alternating effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes alternateSilhouette {
          0%, 45% { opacity: 1; transform: scale(1); }
          50%, 95% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes alternateSilhouetteReverse {
          0%, 45% { opacity: 0; transform: scale(0.95); }
          50%, 95% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        .anim-car {
          animation: alternateSilhouette 6s infinite ease-in-out;
        }
        .anim-moto {
          animation: alternateSilhouetteReverse 6s infinite ease-in-out;
        }

        /* Notifications & Wiggle */
        @keyframes bellWiggle {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
          60% { transform: rotate(-5deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
          100% { transform: rotate(0); }
        }
        .bell-wiggle {
          animation: bellWiggle 0.8s ease-in-out;
        }

        @keyframes toastIn {
          0% { opacity: 0; transform: translateX(10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .toast-entrance {
          animation: toastIn 0.3s ease-out;
        }
      `}} />

      {/* Main Responsive Frame - Full Width Fill Screen */}
      <main className="w-full bg-white flex flex-col min-h-screen animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
        
        {/* TOP SECTION */}
        <div className="flex-none flex flex-col">
          
          {/* Yellow Header Section */}
          <section className="bg-[#e9b11e] rounded-b-[2rem] pt-12 pb-24 px-6 md:px-12 lg:px-24 relative shrink-0">
            
            {/* Logout Button (top left) */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="absolute top-10 left-6 outline-none hover:scale-105 transition-transform"
            >
              <div className="relative bg-white/20 p-2 rounded-full">
                <LogOut className="w-5 h-5 text-black" strokeWidth={2} />
              </div>
            </button>

            {/* Notifications Icon (top right) */}
            <div className="absolute top-10 right-6 z-40">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    setUnreadCount(0); // Reset count when opening
                  }
                }}
                className={`relative bg-white/20 p-2 rounded-full outline-none transition-all hover:scale-105 active:scale-95 ${isBellWiggling ? 'bell-wiggle shadow-[0_0_15px_rgba(233,177,30,0.5)]' : ''}`}
              >
                <Bell 
                  key={isBellWiggling ? 'wiggling' : 'idle'} 
                  className="w-5 h-5 text-black" 
                  strokeWidth={2} 
                />
                
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#e9b11e] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white leading-none">{unreadCount}</span>
                  </div>
                )}
              </button>

              {/* Floating Toast Notification */}
              {showNewFineToast && recentUnpaidFines.length > 0 && (
                <div 
                  onClick={() => router.push(`/statut-fiscal?tab=AMENDES&fineId=${recentUnpaidFines[0].id}&paymentFlow=true`)}
                  className="absolute top-0 right-14 whitespace-nowrap bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-yellow-200 rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer toast-entrance hover:bg-gray-50 transition-all z-[100] min-w-[200px]"
                >
                  <span className="text-sm font-black text-[#1e3b6a]">🚨 Nouvelle amende !</span>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute top-12 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-[#1e3b6a] uppercase tracking-wider">Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {recentUnpaidFines.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-red-500 leading-tight">
                        Vous avez des amendes impayées. Veuillez régulariser votre situation.
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {recentUnpaidFines.map((fine) => (
                          <div key={fine.id} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black text-gray-900 truncate pr-2">{fine.nature_infraction || fine.motif}</span>
                              <span className="text-[10px] font-bold text-[#1e3b6a]">{fine.montant.toLocaleString()} {fine.devise}</span>
                            </div>
                            <button 
                              onClick={() => router.push(`/statut-fiscal?tab=AMENDES&fineId=${fine.id}&paymentFlow=true`)}
                              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline text-left mt-1"
                            >
                              Payer maintenant →
                            </button>
                          </div>
                        ))}
                      </div>
                      <Link 
                        href="/statut-fiscal?tab=AMENDES" 
                        className="block w-full py-2 bg-[#1e3b6a] text-white text-center rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#152e6f] transition-colors mt-2"
                      >
                        Voir tout le statut fiscal
                      </Link>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-bold text-gray-400">Aucune nouvelle notification</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 items-start pr-8">
              {/* Photo Cadre */}
              <div className="w-20 h-20 rounded-full bg-white border-[3px] border-white shadow-xl overflow-hidden shrink-0 mt-1 object-cover">
                 {conducteur.photo ? (
                   <img src={conducteur.photo} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <AlertCircle className="text-gray-400 w-6 h-6" />
                   </div>
                 )}
              </div>

              {/* Main Info */}
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
                 onClick={() => setShowQR(!showQR)}
                 className="bg-white p-3 rounded-2xl shadow-sm hover:scale-105 transition-transform flex items-center justify-center"
              >
                <ScanLine className="w-5 h-5 text-black" />
              </button>
              <button 
                onClick={openContactModal}
                className="bg-white px-6 py-2 rounded-2xl shadow-sm hover:bg-gray-50 font-black text-xs tracking-widest uppercase text-black transition-all"
              >
                Contact
              </button>
            </div>
          </section>

          {/* Floating General Info Card */}
          <div className="px-5 md:px-12 lg:px-24 -mt-20 relative z-10 w-full shrink-0">
            <h2 className="text-[14px] font-black text-[#1e3b6a] mb-2 px-1 tracking-tight">Infos générales</h2>
            
            <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-full -z-10"></div>
               <button className="absolute top-4 right-4 text-gray-400 hover:text-[#1e3b6a] transition-colors p-1 bg-gray-50 rounded-full">
                  <Edit className="w-4 h-4" />
               </button>
               
               <div className="space-y-1.5">
                 <div className="text-[12px] text-gray-700 font-medium">
                    <span className="font-bold text-gray-900">Nationalité:</span> {conducteur.permis?.nationalite || "Congolaise"}
                 </div>
                 <div className="text-[12px] text-gray-700 font-medium">
                    <span className="font-bold text-gray-900">Date de naissance :</span> {conducteur.permis?.date_naissance || "N/A"}
                 </div>
                 <div className="text-[12px] text-gray-700 font-medium">
                    <span className="font-bold text-gray-900">Ecole de formation :</span> {conducteur.ecole_formation || "N/A"}
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

          {/* Account Status / Notifications */}
          <div className="mx-5 md:mx-12 lg:mx-24 mt-5 bg-[#f2f8ff] border-2 border-dashed border-[#84a9e1]/60 rounded-2xl p-4 relative shrink-0 shadow-sm transition-all">
             <div className="absolute -top-[14px] left-6 bg-white border border-[#e2eefa] shadow-sm rounded-full px-4 py-1.5 text-[10px] text-[#1e3b6a] font-bold tracking-wide uppercase">
                État de validité
             </div>
             
             {hasAlerts ? (
               <div className="pt-2 pb-1 flex items-start gap-3 relative overflow-hidden h-12">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-100 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                 </div>
                 <div className="flex-1 min-w-0 relative h-full">
                   {alertsArray.map((alert, idx) => (
                     <div key={idx} 
                      className={`absolute top-0 left-0 w-full transition-all duration-500 transform ${idx === currentAlertIndex ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                       <p className="text-red-600 font-bold text-xs leading-snug truncate">
                          {alert}
                       </p>
                       <p className="text-red-500 font-medium text-[10px] mt-1 leading-snug">
                          Veuillez régulariser cette situation.
                       </p>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="pt-2 pb-1 flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#1e3b6a]" />
                 </div>
                 <div className="text-[#1e3b6a] text-xs font-semibold leading-relaxed whitespace-normal break-words">
                    {alertsArray[0] || "Tout est en règle."}
                 </div>
               </div>
             )}
          </div>

          {/* Buttons Section (Statut fiscal & Expérience) */}
          <div className="flex justify-between items-center px-5 md:px-12 lg:px-24 mt-5 gap-3 shrink-0">
            <button 
               onClick={() => router.push('/statut-fiscal')}
               className="flex-1 bg-[#1de140] hover:bg-[#18cc38] text-black px-3 py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
               <ArrowDown className="w-4 h-4 opacity-70" /> 
               <span className="text-sm">Statut fiscal</span>
            </button>
            <button className="flex-1 bg-[#f4b616] hover:bg-[#e6a800] text-black px-3 py-3 rounded-xl flex justify-center text-sm font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-center">
               Expérience et casier
            </button>
          </div>
          
          <h2 className="text-[14px] font-black text-gray-800 tracking-tight ml-5 md:ml-12 lg:ml-24 mt-5 mb-1 px-1">Flotte Actuelle</h2>
        </div>

        {/* BOTTOM SECTION */}
        <div className="w-full px-5 md:px-12 lg:px-24 pb-8 flex flex-col gap-4 mt-2">

           {/* Vehicles Stacked List */}
           {vehicules.length > 0 && vehicules.map((v, idx) => {
             const assStatus = getValidityStatus(v.date_expiration_assurance);
             const ctStatus = getValidityStatus(v.date_prochain_controle);
             const vigStatus = getValidityStatus(v.date_expiration_vignette);

             return (
              <div key={v.id} className="w-full bg-white rounded-3xl p-3 sm:p-5 shadow-sm border border-gray-100 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 relative transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}>
                
                {/* Vehicle Image */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center p-1">
                   <img src={getUsageIllustration(v.usage_categorie || 'Privé')} alt={v.marque} className="w-full h-full object-contain drop-shadow-sm" />
                </div>

                {/* Vehicle Info */}
                <div className="flex-1 flex flex-col min-w-[150px]">
                   <div className="flex items-center gap-2 flex-wrap">
                     <h4 className="font-black text-[#1e3b6a] text-sm sm:text-lg leading-none">{v.marque} <span className="text-gray-500 font-semibold">{v.modele}</span></h4>
                     <span className="text-[9px] sm:text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest leading-none whitespace-nowrap">
                       {v.plaque}
                     </span>
                   </div>
                   
                   {/* Fiscal Indicators */}
                   <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 mt-2 sm:mt-4">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                         <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: assStatus.color }}></div>
                         <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">ASSURANCE</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                         <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: ctStatus.color }}></div>
                         <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">INSP. TECH</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                         <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: vigStatus.color }}></div>
                         <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">VIGNETTE</span>
                      </div>
                   </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end shrink-0 sm:pl-2 mt-1 sm:mt-0">
                  <button onClick={() => router.push(`/dashboard-conducteur/vehicule/${v.id}`)} className="bg-[#0b5cff] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black shadow-md hover:bg-blue-700 transition-colors uppercase tracking-widest whitespace-nowrap">
                     VOIR FICHE
                  </button>
                </div>
              </div>
             );
           })}

           {/* Add Vehicle Animated Button */}
           <button 
              onClick={() => setShowAddModal(true)}
              className="w-full h-24 bg-gradient-to-r from-[#eef4ff] to-[#f8fbff] rounded-3xl p-4 flex items-center justify-between gap-4 shadow-[#cfdeff]/20 shadow-xl relative overflow-hidden group border-2 border-dashed border-[#caddff] hover:border-[#8ab3f9] shrink-0 mb-6"
           >
              <span className="text-[14px] font-black tracking-tight text-[#1e3b6a] z-10 w-full text-left">Ajoutez un véhicule</span>
              
              {/* Animations Circle */}
              <div className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center relative shadow-sm z-10 shrink-0">
                 <span className="text-blue-600 text-xl font-black z-20 absolute">+</span>
                 {/* Animated Icons */}
                 <Car className="w-6 h-6 text-[#1e3b6a]/20 absolute anim-car" strokeWidth={1.5} />
                 <Bike className="w-6 h-6 text-[#1e3b6a]/20 absolute anim-moto" strokeWidth={1.5} />
              </div>
           </button>
        </div>
      </main>

      {/* Re-using existing QR Code Modal functionality albeit minimal for now */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex py-20 items-center justify-center p-6 animate-fade-in" onClick={() => setShowQR(false)}>
          <div className="glass-card bg-white rounded-[2.5rem] p-10 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-black text-[#1e3b6a]/60 uppercase tracking-[0.3em] mb-4">Votre Identité Numérique</div>
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 mb-6">
              <QRCode value={conducteur.driver_id} size={200} />
            </div>
            <Button onClick={() => setShowQR(false)} className="w-full bg-[#1e3b6a] text-white rounded-xl">Fermer</Button>
          </div>
        </div>
      )}

      {/* Add Vehicle Search Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex py-20 items-center justify-center p-6 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 flex flex-col items-center relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-[#f0f9ff] rounded-2xl flex items-center justify-center mb-5 shrink-0">
              <Car className="w-7 h-7 text-[#1e3b6a]" />
            </div>
            <h3 className="text-xl font-bold text-[#1e3b6a] text-center tracking-tight mb-2">Ajouter un véhicule</h3>
            <p className="text-sm text-center text-gray-500 mb-8 font-medium">Entrez le numéro de plaque unique pour lancer la requête sur la base de données.</p>

            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); handleSearch(); }} className="w-full flex flex-col gap-4">
              <div className="relative">
                <Input
                  placeholder="N° PLAQUE (EX: 1234AB01)"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                  className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#1E3A8A] font-bold text-[#1e3b6a] tracking-wider transition-all w-full placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <Button type="submit" disabled={loadingSearch || !plaque} className="h-14 rounded-2xl bg-[#1E3A8A] hover:bg-[#152e6f] text-white shadow-lg shadow-blue-900/10 w-full flex items-center justify-center font-bold text-sm tracking-wide">
                {loadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : "RECHERCHER VÉHICULE"}
              </Button>
            </form>

            <button onClick={() => setShowAddModal(false)} className="mt-6 text-xs font-bold text-gray-400 hover:text-gray-600 p-2 uppercase tracking-wide">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 flex flex-col items-center relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner shrink-0">
              <LogOut className="w-10 h-10 text-rose-500" />
            </div>

            <h3 className="text-2xl font-black text-[#1e3b6a] text-center tracking-tight mb-2">Déconnexion ?</h3>
            <p className="text-sm text-center text-gray-500 mb-10 font-bold leading-relaxed px-2">
              Êtes-vous sûr de vouloir quitter votre espace sécurisé ?
            </p>

            <div className="w-full flex flex-col gap-3">
              <Button
                onClick={logout}
                className="h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/10 w-full flex items-center justify-center font-black text-sm tracking-widest uppercase"
              >
                C'est compris, sortir
              </Button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 w-full flex items-center justify-center font-black text-sm tracking-widest uppercase transition-colors"
              >
                Rester ici
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The VehiclePreviewModal component handles plate searching manually, keeping its presence here */}
      <VehiclePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        vehicule={vehiculeRecherche}
        onConfirm={lierVehicule}
        loading={loadingSearch}
        error={errorLink}
      />

      <SuccessToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Contact Update Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 flex flex-col items-center relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
               <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1e3b6a] text-center tracking-tight mb-2">Mes Coordonnées</h3>
            <p className="text-sm text-center text-gray-500 mb-8 font-medium">Mettez à jour vos informations de contact pour être joignable par les agents.</p>

            <div className="w-full flex flex-col gap-4">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Adresse Email</span>
                  <Input 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="h-14 bg-gray-50 border-gray-100 rounded-2xl font-bold text-[#1e3b6a]"
                  />
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Numéro de téléphone</span>
                  <Input 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+243 000 000 000"
                    className="h-14 bg-gray-50 border-gray-100 rounded-2xl font-bold text-[#1e3b6a]"
                  />
               </div>

               <Button 
                 onClick={handleUpdateContact}
                 disabled={updatingContact}
                 className="h-14 bg-[#1e3b6a] text-white rounded-2xl font-bold shadow-lg mt-2"
               >
                 {updatingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENREGISTRER LES MODIFICATIONS"}
               </Button>
            </div>

            <button onClick={() => setShowContactModal(false)} className="mt-6 text-xs font-bold text-gray-400 uppercase">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

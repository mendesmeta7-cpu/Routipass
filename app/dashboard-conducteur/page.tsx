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

  // States to evaluate account health
  const [hasAlerts, setHasAlerts] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>("");

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
          conducteurService.getAmendes(profile.id)
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

        // Evaluate simple business rules for Account Status
        evaluateAccountHealth(userAmendes, vehiclesWithPhotos);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const evaluateAccountHealth = (amendesList: Amende[], vehiculesList: VehiculeWithPhotos[]) => {
    const unpaidAmendes = amendesList.filter(a => a.statut !== 'PAYEE');
    if (unpaidAmendes.length > 0) {
      setHasAlerts(true);
      setAlertMessage(`Vous avez ${unpaidAmendes.length} amende(s) impayée(s).`);
      return;
    }

    // Check expiration of the first vehicle as an example (since no complex logic specified)
    const today = new Date();
    let alertFound = false;

    for (const v of vehiculesList) {
      if (v.date_expiration_vignette) {
        const expVignette = new Date(v.date_expiration_vignette);
        if (expVignette < today) {
          setHasAlerts(true);
          setAlertMessage(`La vignette du véhicule ${v.plaque} a expiré.`);
          alertFound = true;
          break;
        }
      }
      if (v.date_expiration_assurance) {
        const expAssurance = new Date(v.date_expiration_assurance);
        if (expAssurance < today) {
          setHasAlerts(true);
          setAlertMessage(`L'assurance du véhicule ${v.plaque} a expiré.`);
          alertFound = true;
          break;
        }
      }
    }

    if (!alertFound) {
      setHasAlerts(false);
      // Ensure we keep this message accurate depending on the UI requests!
      if (vehiculesList.length === 0) {
        setAlertMessage("Vous n'avez pas d'informations de véhicules enregistrés.\nVeuillez lier un véhicule pour circuler tranquillement.");
      } else {
        setAlertMessage("Vous n'avez pas d'informations d'amende.\nVotre compte n'a pas de problème.\nMettez les informations de vos véhicules et commencez à circuler tranquillement.");
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
      evaluateAccountHealth(amendes, newVehiclesList);

      setVehiculeRecherche(null);
      setShowPreview(false);
      setPlaque("");
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
      `}} />

      {/* Main Responsive Web Frame */}
      <main className="w-full max-w-none sm:max-w-5xl bg-white sm:shadow-2xl relative overflow-hidden sm:rounded-[3rem] min-h-screen sm:min-h-[850px] flex flex-col pb-6 mx-auto">

        {/* Yellow Header Section (Spans fully at top) */}
        <section className="bg-[#e9b11e] rounded-b-[3.5rem] pt-12 pb-28 px-6 sm:px-12 relative shrink-0">

          {/* Logout Button (top left) */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="absolute top-10 left-6 sm:left-12 outline-none hover:scale-105 transition-transform"
          >
            <div className="relative bg-white/25 p-2.5 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/40 transition-colors">
              <LogOut className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
          </button>

          {/* Notifications Icon (top right) */}
          <button className="absolute top-10 right-6 sm:right-10 outline-none hover:scale-105 transition-transform">
            <div className="relative bg-white/25 p-2.5 rounded-full backdrop-blur-md border border-white/20">
              <Bell className="w-6 h-6 text-black" strokeWidth={2.5} />
              {hasAlerts && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#e9b11e] shadow-sm"></div>}
            </div>
          </button>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 sm:items-center mt-4">
            {/* Photo Cadre */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 object-cover">
              {conducteur.photo ? (
                <img src={conducteur.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <AlertCircle className="text-gray-400 w-8 h-8" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex flex-col flex-1">
              <h1 className="text-3xl sm:text-4xl font-black font-serif text-black tracking-tight leading-none mb-2">
                {conducteur.prenom} {conducteur.nom}
              </h1>
              <p className="text-sm sm:text-base font-bold text-black/80">
                Permis : {conducteur.numero_permis}
              </p>

              <div className="relative mt-4 h-16 w-full max-w-md">
                <textarea
                  disabled
                  placeholder="Description..."
                  className="w-full h-full resize-none border-2 border-dashed border-black/40 rounded-t-xl rounded-br-xl bg-transparent p-3 text-sm text-black/80 font-medium"
                />
              </div>
            </div>

            <div className="sm:ml-auto flex sm:flex-col items-center gap-4 sm:gap-4 mt-2 sm:mt-0">
              <button
                onClick={() => setShowQR(!showQR)}
                className="bg-white p-4 rounded-[1.5rem] shadow-md hover:scale-105 transition-transform hover:shadow-lg flex items-center justify-center"
              >
                <ScanLine className="w-7 h-7 text-black" />
              </button>
              <button className="bg-white px-8 py-4 rounded-[1.5rem] shadow-md hover:bg-gray-50 font-black text-sm tracking-widest uppercase text-black transition-all hover:shadow-lg w-full sm:w-auto">
                Contact
              </button>
            </div>
          </div>
        </section>

        {/* Content area: Grid on Desktop, Column on Mobile */}
        <div className="relative z-10 w-full shrink-0 grid grid-cols-1 md:grid-cols-12 gap-8 px-6 sm:px-12 -mt-16 pb-12">

          {/* Left side: Infos Générales floating card & Quick Buttons */}
          <div className="md:col-span-4 flex flex-col gap-8">

            {/* General Info Card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -z-10"></div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[17px] font-black text-[#1e3b6a] tracking-tight">Infos générales</h2>
                <button className="text-gray-400 hover:text-[#1e3b6a] transition-colors p-1 bg-gray-50 rounded-full">
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="text-[13px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Nationalité:</span> {conducteur.permis?.nationalite || "Congolaise"}
                </div>
                <div className="text-[13px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Date de naissance :</span> {conducteur.permis?.date_naissance || "N/A"}
                </div>
                <div className="text-[13px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Ecole de formation :</span> {conducteur.ecole_formation || "N/A"}
                </div>
                <div className="text-[13px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Ville :</span> {conducteur.ville || "Kinshasa"}
                </div>
                <div className="text-[13px] text-gray-700 font-medium">
                  <span className="font-bold text-gray-900">Commune:</span> {conducteur.commune || "N/A"}
                </div>
                <div className="text-[13px] text-gray-700 font-medium leading-relaxed">
                  <span className="font-bold text-gray-900">Adresse :</span> {conducteur.adresse || "N/A"}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-row md:flex-col gap-3 md:mt-2">
              <button className="flex-1 bg-[#1de140] hover:bg-[#18cc38] text-black px-4 py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <ArrowDown className="w-5 h-5 opacity-70" /> Statut fiscal
              </button>
              <button className="flex-1 bg-[#f4b616] hover:bg-[#e6a800] text-black px-4 py-3 sm:py-4 rounded-2xl flex justify-center items-center text-sm sm:text-base font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-center">
                Expérience et casier
              </button>
            </div>
          </div>

          {/* Right side: Alerts and Vehicles */}
          <div className="md:col-span-8 flex flex-col gap-10 md:mt-16">

            {/* Account Status / Notifications */}
            <div className="bg-[#f2f8ff] border-2 border-dashed border-[#84a9e1]/60 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative shrink-0 transition-all hover:shadow-md">
              <div className="absolute -top-[14px] left-10 bg-white border border-[#e2eefa] shadow-md rounded-full px-6 py-1.5 text-xs text-[#1e3b6a] font-bold tracking-widest uppercase">
                État de validité
              </div>

              {hasAlerts ? (
                <div className="text-center sm:text-left pt-2 pb-1 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0 shadow-inner">
                    <AlertCircle className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-600 font-bold text-sm">
                      {alertMessage.split('.')[0]}.
                    </p>
                    <p className="text-red-500 font-medium text-xs mt-1 leading-snug">
                      {alertMessage.split('.')[1] || "Veuillez vous assurer d'être en règle pour circuler en toute tranquillité."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center sm:text-left pt-2 pb-1 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0 shadow-inner">
                    <CheckCircle2 className="w-7 h-7 text-[#1E3A8A]" />
                  </div>
                  <div className="text-[#1e3b6a] text-xs font-semibold leading-relaxed">
                    {alertMessage.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicles Stacked List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 ml-2 mb-1">
                <Car className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-black text-gray-800 tracking-tight">Véhicules enregistrés</h2>
              </div>

              {vehicules.length > 0 && vehicules.map((v) => (
                <div key={v.id} className="w-full bg-white rounded-3xl p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-5 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 group">

                  {/* Vehicle Image Placeholder */}
                  <div className="w-full sm:w-32 h-40 sm:h-32 shrink-0 bg-[#f8fbff] rounded-[2rem] flex items-center justify-center border-2 border-[#e6effa] group-hover:border-[#caddff] transition-colors shadow-inner">
                    {v.usage_categorie?.toUpperCase().includes('MOTO') ? (
                      <Bike className="w-16 h-16 text-[#4a72ba]" strokeWidth={1} />
                    ) : (
                      <Car className="w-16 h-16 text-[#4a72ba]" strokeWidth={1} />
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[#1e3b6a] text-[17px] truncate">{v.marque} {v.modele}</h4>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 ml-2">
                        {v.plaque}
                      </span>
                    </div>

                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Assurance</div>
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Insp. Tech</div>
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> vignette</div>
                    </div>

                    {/* Conducteurs associés */}
                    {v.photosAssociees && v.photosAssociees.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-[10px] font-bold text-gray-400">Co-Pilotes:</span>
                        <div className="flex -space-x-2">
                          {v.photosAssociees.map((photo, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="w-full sm:w-auto mt-4 sm:mt-0 bg-[#0051ff] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 shrink-0 hover:bg-blue-700 hover:scale-105 transition-all">
                    Voir Fiche
                  </button>
                </div>
              ))}

              {/* Add Vehicle Animated Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full h-40 sm:h-32 bg-gradient-to-br from-[#eef4ff] to-[#f8fbff] rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group mt-4 border-2 border-dashed border-[#caddff] hover:border-[#8ab3f9] hover:-translate-y-1"
              >
                <div className="flex flex-col items-center sm:items-start z-10">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1e3b6a]">Ajouter un véhicule</span>
                  <span className="text-xs font-bold text-[#1e3b6a]/50 uppercase tracking-widest mt-1">Liez vos documents en quelques secondes</span>
                </div>

                {/* Animations Circle */}
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center relative shadow-xl z-10 shrink-0 transform group-hover:rotate-12 transition-transform">
                  <span className="text-blue-600 text-3xl font-black z-20 absolute mt-0.5">+</span>
                  {/* Animated Icons */}
                  <Car className="w-10 h-10 text-[#1e3b6a]/30 absolute anim-car" strokeWidth={1.5} />
                  <Bike className="w-10 h-10 text-[#1e3b6a]/30 absolute anim-moto" strokeWidth={1.5} />
                </div>
              </button>
            </div>
          </div>
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
            <h3 className="text-xl font-bold text-[#1e3b6a] text-center tracking-tight mb-2">Associer un véhicule</h3>
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
                {loadingSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : "RECHERCHER UNITE"}
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
        message="Véhicule lié avec succès à votre profil !"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

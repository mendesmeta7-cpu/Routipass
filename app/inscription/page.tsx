"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { conducteurService } from "@/services/conducteurs";
import { Permis } from "@/types";

export default function InscriptionPage() {
  const router = useRouter();
  
  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [numeroPermis, setNumeroPermis] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorPermis, setErrorPermis] = useState("");
  
  const [donneesPermis, setDonneesPermis] = useState<Permis | null>(null);
  const [finalDriverId, setFinalDriverId] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    pin: "",
    ville: "",
    commune: "",
    adresse: "",
    ecoleFormation: ""
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleVerifyPermis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVerify(true);
    setErrorPermis("");

    try {
      const permis = await conducteurService.verifyPermis(numeroPermis);
      if (permis) {
        // Check if the license is already linked to a conductor account
        const isUsed = await conducteurService.isNumeroPermisUsed(numeroPermis);
        if (isUsed) {
          setErrorPermis("Ce numéro de permis est déjà utilisé, Le compte existe déjà");
          setLoadingVerify(false);
          return;
        }
        setDonneesPermis(permis);
        setEtape(2);
      } else {
        setErrorPermis("Permis invalide. Données officielles CONADEP introuvables.");
      }
    } catch (err: any) {
      setErrorPermis("Erreur lors de la vérification : " + err.message);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      const nouveauConducteur = await conducteurService.createConducteur({
        numero_permis: numeroPermis,
        email: formData.email || undefined,
        pin: formData.pin,
        ville: formData.ville,
        commune: formData.commune,
        adresse: formData.adresse,
        ecole_formation: formData.ecoleFormation
      });

      setFinalDriverId(nouveauConducteur.driver_id);
      setEtape(3);
    } catch (err: any) {
      console.error("Erreur Inscription:", err);
      alert("Erreur lors de la création du compte.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="kinetic-bg min-h-screen w-full flex items-center justify-center p-6 relative font-body text-on-background bg-background overflow-hidden animate-fade-in py-12">
      {/* Organic Background Shapes */}
      <div className="organic-shape bg-on-primary-container w-[300px] h-[300px] md:w-[500px] md:h-[500px] -top-20 -left-10 md:-top-40 md:-left-20 rounded-full animate-pulse opacity-30"></div>
      <div className="organic-shape bg-secondary w-[400px] h-[400px] md:w-[600px] md:h-[600px] -bottom-30 -right-10 md:-bottom-60 md:-right-20 rounded-full animate-float opacity-20"></div>
      
      {/* Sprinkled Icons */}
      <div className="floating-icon top-10 left-[15%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-6xl">verified_user</span>
      </div>
      <div className="floating-icon bottom-20 left-[10%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-7xl">directions_transit</span>
      </div>
      <div className="floating-icon top-[20%] right-[15%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-5xl">id_card</span>
      </div>

      <div className="relative z-10 w-full max-w-[640px]">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="group transition-all hover:scale-105">
            <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              Routipass
            </h1>
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-lg shadow-[0_20px_50px_rgba(15,29,37,0.08)] p-8 md:p-12 border border-outline-variant/15 glass-card relative overflow-hidden">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center size-16 bg-on-primary-container rounded-full mb-6 shadow-lg shadow-on-primary-container/20">
               <span className="material-symbols-outlined !text-3xl text-on-primary-fixed">
                {etape === 1 ? "document_scanner" : etape === 2 ? "person_edit" : "celebration"}
               </span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-on-background tracking-tight">
              {etape === 1 ? "Vérification Permis" : etape === 2 ? "Votre Profil" : "Compte Créé !"}
            </h1>
            <p className="text-on-surface-variant font-medium mt-2">
              {etape === 1 ? "Étape 1 : Validez votre identité officielle" : etape === 2 ? "Étape 2 : Finalisez votre espace sécurisé" : "Félicitations, vous êtes prêt !"}
            </p>
          </div>

          {/* STEP 1: License Verification */}
          {etape === 1 && (
            <form onSubmit={handleVerifyPermis} className="space-y-6">
              <div className="bg-surface-container p-6 rounded-3xl text-sm font-medium border border-outline-variant/10 leading-relaxed text-on-surface-variant">
                Pour créer votre identité numérique, nous devons d'abord authentifier votre permis auprès des services officiels de la CONADEP.
              </div>
              
              <div className="space-y-3 px-1">
                <label className="text-on-background font-label font-bold text-sm ml-4">Numéro de permis national</label>
                <div className="relative group">
                  <input 
                    className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-14 px-6 text-on-surface font-black tracking-widest text-lg transition-all placeholder:text-outline/60 shadow-inner placeholder:tracking-normal placeholder:font-medium" 
                    placeholder="ex: CD123456" 
                    type="text"
                    value={numeroPermis}
                    onChange={(e) => setNumeroPermis(e.target.value.toUpperCase())}
                    disabled={loadingVerify}
                    required
                  />
                </div>
              </div>

              {errorPermis && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-fade-in text-center shadow-sm">
                  {errorPermis}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-on-primary-container hover:bg-primary-container hover:text-on-primary-container text-on-primary-fixed h-14 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-on-primary-container/20 group premium-button" 
                disabled={loadingVerify}
              >
                {loadingVerify ? <Loader2 className="w-6 h-6 animate-spin text-on-primary-fixed" /> : (
                  <>VÉRIFIER LE PERMIS <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span></>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Profile Form */}
          {etape === 2 && donneesPermis && (
            <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
              {/* Official Conductor Identity Preview */}
              <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined !text-9xl text-on-secondary-container">shield_check</span>
                </div>
                
                <div className="flex items-center gap-2 text-secondary font-black text-[10px] uppercase tracking-widest mb-6 px-1">
                  <span className="material-symbols-outlined !text-sm text-emerald-500">check_circle</span>
                  Validé par CONADEP RDC
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                  {donneesPermis.photo && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-white">
                      <img 
                        src={donneesPermis.photo} 
                        alt="Photo du titulaire" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <div className="text-[10px] font-bold text-outline uppercase tracking-widest">Identité du Titulaire</div>
                      <div className="text-xl font-black text-on-background uppercase tracking-tight">
                        {donneesPermis.nom} {donneesPermis.prenom}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined !text-xs text-slate-400">location_on</span>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Né(e) à {donneesPermis.lieu_naissance}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-outline uppercase tracking-widest">Catégorie</div>
                        <div className="text-sm font-black text-on-surface-variant font-headline">{donneesPermis.categorie_permis}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-outline uppercase tracking-widest">Né(e) le</div>
                        <div className="text-sm font-black text-on-surface-variant font-headline">{donneesPermis.date_naissance}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="text-[10px] font-black text-outline uppercase tracking-[0.2em] border-b border-outline-variant/20 pb-2 ml-4">
                  SÉCURITÉ & LOCALISATION
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 px-1">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">Email (Optionnel)</label>
                    <input 
                      type="email" 
                      placeholder="votre@email.com" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-medium transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 px-1">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">Code PIN (Définitif)</label>
                    <input 
                      type="password" 
                      required 
                      maxLength={6}
                      placeholder="••••" 
                      value={formData.pin} 
                      onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                      className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-black text-lg tracking-[0.5em] transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 px-1">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">Province / Ville</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Kinshasa" 
                      value={formData.ville} 
                      onChange={(e) => setFormData({...formData, ville: e.target.value})} 
                      className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-medium shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 px-1">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">Commune</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Gombe" 
                      value={formData.commune} 
                      onChange={(e) => setFormData({...formData, commune: e.target.value})} 
                      className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-medium shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 px-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">Adresse complète</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Avenue / Quartier / Numéro" 
                      value={formData.adresse} 
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})} 
                      className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-medium shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2 px-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-on-surface-variant ml-4 uppercase tracking-tighter">École de formation</label>
                    <div className="relative group">
                      <select 
                        required
                        className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-12 px-6 text-on-surface font-medium shadow-inner appearance-none transition-all pr-12"
                        value={formData.ecoleFormation}
                        onChange={(e) => setFormData({...formData, ecoleFormation: e.target.value})}
                      >
                        <option value="" disabled>Sélectionnez votre auto-école</option>
                        <option value="Auto-école Makumbi">1. Auto-école Makumbi</option>
                        <option value="CAMS Auto-école">2. CAMS Auto-école</option>
                        <option value="Auto-école Excellence">3. Auto-école Excellence</option>
                        <option value="Auto formation">Auto formation</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-outline/40">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEtape(1)} 
                  className="sm:w-1/3 h-14 rounded-full text-on-surface-variant font-bold hover:text-secondary hover:bg-surface-container transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span> RETOUR
                </button>
                <button 
                  type="submit" 
                  className="sm:w-2/3 h-14 bg-on-primary-container hover:bg-primary-container hover:text-on-primary-container text-on-primary-fixed rounded-full font-headline font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-on-primary-container/20 premium-button" 
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? (
                    <Loader2 className="w-6 h-6 animate-spin text-on-primary-fixed" />
                  ) : (
                    <>FINALISER MON COMPTE <span className="material-symbols-outlined text-xl">how_to_reg</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Summary & Recap */}
          {etape === 3 && donneesPermis && (
            <div className="space-y-10 animate-fade-in text-center">
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl text-sm font-bold border border-emerald-100 shadow-sm">
                Votre identité numérique Routipass a été créée avec succès. Conservez précieusement vos identifiants.
              </div>

              {/* Recruitment Card Styled Summary */}
              <div className="bg-surface-container border border-outline-variant/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl max-w-sm mx-auto animate-float">
                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                  <span className="material-symbols-outlined !text-[12rem]">verified</span>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                  {donneesPermis.photo && (
                    <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-8 border-white shadow-2xl bg-white rotate-2 hover:rotate-0 transition-transform duration-500">
                      <img 
                        src={donneesPermis.photo} 
                        alt="Conducteur" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-on-background uppercase tracking-tight">
                      {donneesPermis.nom} {donneesPermis.prenom}
                    </h2>
                    <p className="text-secondary font-bold text-xs tracking-widest uppercase">CHAUFFEUR CERTIFIÉ</p>
                  </div>

                  <div className="w-full bg-white/80 p-6 rounded-3xl shadow-inner border border-white space-y-3">
                    <div className="text-[10px] font-black text-outline uppercase tracking-widest">
                      Identifiant de Connexion
                    </div>
                    <div className="text-2xl font-black text-primary-design tracking-tighter select-all cursor-copy hover:scale-105 transition-transform" title="Cliquez pour sélectionner">
                      {finalDriverId}
                    </div>
                    <div className="text-[9px] font-bold text-on-surface-variant/60">
                      Saisissez cet ID et votre PIN pour vous connecter
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link 
                  href="/login" 
                  className="w-full h-16 bg-on-background text-white rounded-full font-headline font-black text-xl flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl shadow-on-background/30 hover:scale-[1.02] active:scale-100 premium-button"
                >
                  SE CONNECTER MAINTENANT
                  <span className="material-symbols-outlined !text-3xl">login</span>
                </Link>
                <p className="mt-6 text-xs font-bold text-outline">
                  Une question ? <Link href="#" className="underline text-secondary">Contactez le support agent</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer/Bottom Link */}
        {etape !== 3 && (
          <div className="text-center mt-12">
            <Link href="/login" className="text-xs font-bold text-outline hover:text-secondary transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 group">
              DÉJÀ UN COMPTE ? <span className="text-on-background group-hover:underline">SE CONNECTER</span>
            </Link>
          </div>
        )}
      </div>

       {/* Decorative Bottom Branding */}
       <div className="fixed bottom-10 right-10 text-on-surface-variant/20 pointer-events-none select-none hidden md:block">
        <h2 className="font-headline font-black text-8xl tracking-tighter opacity-10 uppercase">
          {etape === 3 ? "CERTIFIED" : "REGISTER"}
        </h2>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { authService } from "@/services/auth";
import { conducteurService } from "@/services/conducteurs";
import { Permis } from "@/types";

export default function InscriptionPage() {
  const router = useRouter();
  
  const [etape, setEtape] = useState<1 | 2>(1);
  const [numeroPermis, setNumeroPermis] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [errorPermis, setErrorPermis] = useState("");
  
  const [donneesPermis, setDonneesPermis] = useState<Permis | null>(null);

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

      await authService.signInDriver(nouveauConducteur.driver_id, formData.pin);
      router.push("/dashboard-conducteur");
    } catch (err: any) {
      console.error("Erreur Inscription:", err);
      alert("Erreur lors de la création du compte.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#F0F9FF] relative overflow-hidden animate-fade-in font-sans">
      
      {/* Background Illustration */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-30">
        <Image
          src="/images/transport_isometric.jpeg"
          alt="Illustration"
          fill
          className="object-contain object-left-bottom transform scale-125 -translate-x-[15%] translate-y-[20%]"
        />
      </div>

      <div className="max-w-2xl mx-auto relative z-10 space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-6 group transition-all hover:scale-105">
            <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              Routipass
            </h1>
          </Link>
        </div>

        <Card className="glass-card border-white/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A8A]"></div>
          
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#EBF5FF] rounded-2xl flex items-center justify-center border border-[#1E3A8A]/10">
                <UserPlus className="w-6 h-6 text-[#1E3A8A]" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-[#1E3A8A]">Inscription</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-base mt-2">
              {etape === 1 ? "Étape 1 : Vérification du permis national" : "Étape 2 : Finalisation de votre identité numérique"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            
            {etape === 1 && (
              <form onSubmit={handleVerifyPermis} className="space-y-6">
                <div className="bg-[#1E3A8A]/5 text-[#1E3A8A] p-5 rounded-2xl text-sm font-medium border border-[#1E3A8A]/10 leading-relaxed shadow-sm">
                  Saisissez votre numéro de permis pour vérifier sa validité auprès de la base de données officielle CONADEP.
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Numéro de permis</label>
                  <Input 
                    placeholder="ex: CD123456" 
                    value={numeroPermis}
                    onChange={(e) => setNumeroPermis(e.target.value.toUpperCase())}
                    required
                    className="bg-white/60 border-white/50 h-14 rounded-2xl focus:ring-[#1E3A8A] focus:border-[#1E3A8A] text-lg font-bold tracking-widest placeholder:text-slate-300 placeholder:tracking-normal transition-all"
                  />
                </div>

                {errorPermis && (
                  <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-fade-in shadow-sm text-center">
                    {errorPermis}
                  </div>
                )}

                <Button type="submit" className="w-full h-14 text-base font-black bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-2xl shadow-xl shadow-blue-900/20 premium-button mt-4" disabled={loadingVerify}>
                  {loadingVerify ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>VÉRIFIER LE PERMIS <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </form>
            )}

            {etape === 2 && donneesPermis && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                
                {/* Official Conductor Identity Card */}
                <div className="bg-[#EBF5FF] border border-[#1E3A8A]/10 rounded-3xl p-6 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-24 h-24 text-[#1E3A8A]" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#1E3A8A] font-black text-xs uppercase tracking-widest mb-6 px-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Permis Valide • CONADEP RDC
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
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom & Prénom</div>
                        <div className="text-xl font-black text-[#1E3A8A] truncate uppercase">
                          {donneesPermis.nom} {donneesPermis.prenom}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catégorie</div>
                          <div className="text-sm font-black text-slate-700">{donneesPermis.categorie_permis}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Né(e) le</div>
                          <div className="text-sm font-black text-slate-700">{donneesPermis.date_naissance}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Security & Info */}
                <div className="space-y-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 ml-1">
                    SÉCURITÉ & LOCALISATION
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Email</label>
                      <Input type="email" placeholder="votre@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Code PIN (4-6 chiffres)</label>
                      <Input 
                        type="password" 
                        required 
                        maxLength={6}
                        placeholder="••••" 
                        value={formData.pin} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, pin: val});
                        }} 
                        className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A] transition-all font-black text-lg tracking-widest"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Ville</label>
                      <Input type="text" required placeholder="Kinshasa" value={formData.ville} onChange={(e) => setFormData({...formData, ville: e.target.value})} className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Commune</label>
                      <Input type="text" required placeholder="Gombe" value={formData.commune} onChange={(e) => setFormData({...formData, commune: e.target.value})} className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A]" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Adresse complète</label>
                      <Input type="text" required placeholder="Avenue / Quartier / Numéro" value={formData.adresse} onChange={(e) => setFormData({...formData, adresse: e.target.value})} className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setEtape(1)} className="sm:w-1/3 h-14 rounded-2xl text-slate-400 font-bold hover:text-[#1E3A8A] hover:bg-[#EBF5FF]">
                    <ArrowLeft className="mr-2 w-4 h-4" /> RETOUR
                  </Button>
                  <Button type="submit" className="sm:w-2/3 h-14 text-base font-black bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-2xl shadow-xl shadow-blue-900/20 premium-button" disabled={loadingSubmit}>
                    {loadingSubmit ? <Loader2 className="w-6 h-6 animate-spin" /> : "FINALISER MON COMPTE"}
                  </Button>
                </div>
              </form>
            )}

          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-[#1E3A8A] transition-colors uppercase tracking-widest">
            DÉJÀ UN COMPTE ? SE CONNECTER
          </Link>
        </div>
      </div>
    </div>
  );
}

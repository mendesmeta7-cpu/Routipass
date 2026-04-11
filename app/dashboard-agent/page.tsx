"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, Camera, Search, Bell, User, Database, Star, 
  Car, FileText, CheckCircle2, XCircle, ArrowRight, Loader2, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";
import { agentService, VerificationResult } from "@/services/agent";
import { ScannerQR } from "@/components/ScannerQR";

export default function DashboardAgent() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [scannedDriver, setScannedDriver] = useState<VerificationResult | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formAmende, setFormAmende] = useState({ motif: "", montant: "" });
  const [showAmendeForm, setShowAmendeForm] = useState(false);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      
      if (!user || user.user_metadata?.role !== 'AGENT') {
        router.push('/login');
        return;
      }
      
      setAgent({
        nom: user.user_metadata.nom || "",
        agentId: user.user_metadata.agent_id || "",
        matricule: user.user_metadata.matricule || "",
        photo: user.user_metadata.photo || null
      });
    };
    checkAuth();
  }, [router]);

  const handleScanSuccess = async (decodedId: string) => {
    setIsScannerOpen(false);

    // Si l'ID est au nouveau format (conducteur_vehicule), on redirige vers la vue détaillée
    if (decodedId.includes('_')) {
      router.push(`/scan/${decodedId}`);
      return;
    }

    setLoading(true);
    try {
      const result = await agentService.verifyDriver(decodedId);
      setScannedDriver(result);
      setShowAmendeForm(false);
      
      const hasRed = Object.values(result.validity).includes('Rouge');
      await agentService.logControl(
        agent.userId ?? agent.agentId, 
        result.driver.id ?? decodedId, 
        hasRed ? 'INFRACTION' : 'VALIDE'
      );
    } catch (error: any) {
      alert(error.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const soumettreAmende = (e: React.FormEvent) => {
    e.preventDefault();
    setFormAmende({ motif: "", montant: "" });
    setShowAmendeForm(false);
    setScannedDriver(null);
  };

  const logout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#E6F0FC] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <p className="text-xs font-black text-slate-800 tracking-[0.3em] uppercase">Vérification...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6F0FC] flex flex-col font-sans relative pb-8 animate-fade-in">
      
      {/* 1. En-tête de Profil Dynamique (Calqué sur la maquette mobile) */}
      <div className="relative pt-16 pb-6 px-6 flex flex-col items-center">
        {/* Badge "Agent" vert pomme en haut à gauche */}
        <div className="absolute top-8 left-6 bg-[#4CAF50] text-white font-bold text-sm px-4 py-1.5 rounded-lg shadow-sm tracking-wide z-10">
          Agent
        </div>
        
        {/* Déconnexion */}
        <button onClick={logout} className="absolute top-8 right-6 text-slate-400 hover:text-slate-700 transition-colors z-10" title="Se déconnecter">
          <LogOut className="w-6 h-6" />
        </button>

        {/* Photo Circulaire */}
        <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-[#E6F0FC] mb-4 bg-slate-200 flex items-center justify-center relative z-0">
          {agent.photo ? (
            <img src={agent.photo} alt="Profil Agent" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-slate-400" />
          )}
        </div>
        
        {/* Nom + Etoile */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {agent.nom}
          </h1>
          <Star className="w-6 h-6 fill-[#FFC107] text-[#FFC107]" />
        </div>
      </div>

      {/* 2. Zone Principale (Bento Grid Workspace ou Résultat du Scan) */}
      <div className="flex-1 w-full max-w-md lg:max-w-5xl mx-auto px-5 flex flex-col">
        
        {isScannerOpen && (
          <ScannerQR 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}

        {!scannedDriver ? (
           // GRILLE ESPACE DE TRAVAIL (Bento Grid)
           <div className="bg-[#f8fafc] rounded-[2.5rem] p-6 lg:p-10 shadow-sm flex-1 flex flex-col mb-4">
              <h2 className="text-center font-bold text-slate-900 text-lg lg:text-2xl mb-8 tracking-tight">Espace travail</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-8 mb-5 mt-auto mb-auto">
                 {/* Module 1: Scanner */}
                 <button onClick={() => setIsScannerOpen(true)} className="bg-gradient-to-b from-white to-blue-50/50 p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm shadow-blue-900/5 flex flex-col items-center justify-center gap-3 aspect-square transition-all hover:-translate-y-1 active:scale-95 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Camera className="w-14 h-14 lg:w-16 lg:h-16 text-slate-800" strokeWidth={1.5} />
                    <span className="text-xs lg:text-sm font-bold text-slate-900 text-center leading-tight">Scanner<br/>le QR code</span>
                 </button>

                 {/* Module 2: Recherche */}
                 <button onClick={() => router.push('/dashboard-agent/recherche')} className="bg-white p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-3 aspect-square transition-all hover:-translate-y-1 active:scale-95 hover:bg-slate-50">
                    <Search className="w-14 h-14 lg:w-16 lg:h-16 text-slate-800" strokeWidth={1.5} />
                    <span className="text-xs lg:text-sm font-bold text-slate-900">Recherche</span>
                 </button>

                 {/* Module 3: Alerte */}
                 <button className="bg-white p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-3 aspect-square relative transition-all hover:-translate-y-1 active:scale-95 hover:bg-slate-50">
                    <div className="absolute top-4 right-4 bg-[#4CAF50] text-white text-[10px] lg:text-xs font-black w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shadow-sm">3</div>
                    <Bell className="w-14 h-14 lg:w-16 lg:h-16 text-slate-800" strokeWidth={1.5} />
                    <span className="text-xs lg:text-sm font-bold text-slate-900">Alerte</span>
                 </button>

                 {/* Module 4: Conducteurs signaler */}
                 <button className="bg-white p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-3 aspect-square relative transition-all hover:-translate-y-1 active:scale-95 hover:bg-slate-50">
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] lg:text-xs font-black w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shadow-sm">5</div>
                    <User className="w-14 h-14 lg:w-16 lg:h-16 text-slate-800" strokeWidth={1.5} />
                    <span className="text-xs lg:text-sm font-bold text-slate-900 text-center leading-tight">Conducteurs<br/>signaler</span>
                 </button>

                 {/* Module 5: Historique (Bottom Centered on Mobile, 5th Column on Desktop) */}
                 <div className="col-span-2 md:col-span-1 flex justify-center w-full h-full">
                    <button className="bg-gradient-to-b from-white to-slate-50 p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-3 aspect-square transition-all hover:-translate-y-1 active:scale-95 w-32 md:w-full">
                       <Database className="w-14 h-14 lg:w-16 lg:h-16 text-slate-800" strokeWidth={1.5} />
                       <span className="text-xs lg:text-sm font-bold text-slate-900">Historique</span>
                    </button>
                 </div>
              </div>
           </div>
        ) : (
           // CARTE ROSE NUMERIQUE RESULTAT DU SCAN
           <div className="bg-[#f8fafc] rounded-[2.5rem] p-6 shadow-sm flex-1 flex flex-col mb-4 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Résultat du Contrôle</h3>
                <Button variant="ghost" onClick={() => setScannedDriver(null)} className="h-8 px-3 text-slate-500 font-bold hover:bg-slate-200 rounded-full text-xs">FERMER</Button>
              </div>

              {/* Identity Card */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                    {scannedDriver.driver.photo_url ? (
                      <img src={scannedDriver.driver.photo_url} alt="Conducteur" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conducteur</div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">{scannedDriver.driver.nom_complet || scannedDriver.driver.nom}</h4>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">ID</span>
                    <span className="font-mono text-xs font-black text-slate-700">{scannedDriver.driver.driver_id}</span>
                  </div>
                  <div className={`p-3 rounded-2xl flex items-center justify-between border ${scannedDriver.driver.statut !== 'Suspendu' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <div className="flex items-center gap-2">
                      {scannedDriver.driver.statut !== 'Suspendu' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="text-xs font-black uppercase tracking-widest">
                        Permis {scannedDriver.driver.statut || "Valide"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Context & Pastilles */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-md">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {scannedDriver.vehicules.length > 0 ? scannedDriver.vehicules[0].plaque : "Aucun Véhicule"}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">
                      {scannedDriver.vehicules.length > 0 ? `${scannedDriver.vehicules[0].marque} ${scannedDriver.vehicules[0].modele}` : "-"}
                    </h4>
                  </div>
                </div>
                
                {/* Les 3 Pastilles (Carte Rose) */}
                <div className="space-y-3 mt-6">
                  {[
                    { label: 'Assurance', val: scannedDriver.validity.assurance },
                    { label: 'Vignette', val: scannedDriver.validity.vignette },
                    { label: 'Contrôle Tech.', val: scannedDriver.validity.controle_technique }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{doc.label}</span>
                      <div className="flex items-center gap-2">
                        {doc.val === 'Vert' && <span className="text-[10px] font-black text-emerald-600 uppercase">En règle</span>}
                        {doc.val === 'Orange' && <span className="text-[10px] font-black text-amber-600 uppercase">Imminent</span>}
                        {doc.val === 'Rouge' && <span className="text-[10px] font-black text-rose-600 uppercase">Invalide</span>}
                        <div className={`w-3 h-3 rounded-full ${doc.val === 'Vert' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : doc.val === 'Orange' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verbalisation Section */}
              <div className="bg-rose-50 rounded-[2rem] p-6 border border-rose-100">
                {!showAmendeForm ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-lg font-black text-rose-900 tracking-tight mb-1">Verbalisation</h4>
                      <p className="text-xs text-rose-700/70 font-bold uppercase tracking-widest">
                        {scannedDriver.amendes.length > 0 
                          ? `${scannedDriver.amendes.length} amende(s) impayée(s)`
                          : "Aucune amende en attente"}
                      </p>
                      {scannedDriver.amendes.length > 0 && (
                        <div className="flex flex-col gap-3 mt-4">
                           {scannedDriver.amendes.map((amende: any) => (
                             <div key={amende.id} className="bg-white p-3.5 rounded-2xl border border-rose-100 flex flex-col shadow-sm gap-2 transition-all hover:border-rose-200">
                               <div className="flex justify-between items-start gap-3">
                                  <span className="font-black text-xs text-slate-800 leading-tight uppercase tracking-tight">
                                     {amende.fine_types?.name || amende.nature_infraction || amende.motif || 'Infraction'}
                                  </span>
                                  <span className="font-black text-rose-600 shrink-0 text-sm">{amende.montant} {amende.devise || 'CDF'}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${amende.fine_types?.categorie_cible === 'Véhicule' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                     Cible: {amende.fine_types?.categorie_cible || 'Conducteur'}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${(!amende.fine_types?.gravite || amende.fine_types?.gravite === 'Moyenne') ? 'bg-orange-50 text-orange-700' : amende.fine_types?.gravite === 'Faible' ? 'bg-yellow-50 text-yellow-700' : amende.fine_types?.gravite === 'Grave' ? 'bg-red-50 text-red-700' : 'bg-rose-900 text-rose-100'}`}>
                                     {amende.fine_types?.gravite || 'Moyenne'}
                                  </span>
                               </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => setShowAmendeForm(true)} className="h-12 w-full rounded-xl bg-rose-600 text-white font-black tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all text-xs mt-2">
                      DRESSER UNE AMENDE
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={soumettreAmende} className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-rose-600" />
                      <h4 className="text-sm font-black text-rose-900 tracking-tight uppercase">Nouvelle Contravention</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Input 
                          placeholder="Motif (ex: DÉFAUT ASSURANCE)" 
                          className="h-12 bg-white border-rose-100 rounded-xl focus:ring-rose-500 font-bold px-4 text-xs"
                          required 
                          value={formAmende.motif}
                          onChange={(e) => setFormAmende({...formAmende, motif: e.target.value.toUpperCase()})}
                        />
                      </div>
                      
                      <div>
                        <Input 
                          type="number" 
                          placeholder="Montant (CDF)" 
                          className="h-12 bg-white border-rose-100 rounded-xl focus:ring-rose-500 font-bold px-4 text-xs"
                          required
                          value={formAmende.montant}
                          onChange={(e) => setFormAmende({...formAmende, montant: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-black tracking-widest shadow-md text-[10px]">
                        CONFIRMER
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowAmendeForm(false)} className="h-12 px-4 rounded-xl text-rose-700 font-bold bg-white text-[10px]">
                        ANNULER
                      </Button>
                    </div>
                  </form>
                )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}

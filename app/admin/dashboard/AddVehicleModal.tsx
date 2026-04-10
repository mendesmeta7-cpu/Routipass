"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { adminService } from "@/services/admin";
import { Loader2, User, Car, Cog, Calendar, RefreshCcw, ShieldCheck, Zap, Info, MapPin, Phone, Hash, Fuel, Gauge, Weight, Activity, CreditCard } from "lucide-react";
import { generateVIN, getUsageIllustration, generatePlate } from "@/utils/vehicleUtils";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [isManualPuissance, setIsManualPuissance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    plaque: "",
    marque: "",
    modele: "",
    annee: new Date().getFullYear(),
    chassis_no: "",
    energie: "Essence",
    puissance: "",
    ptac: "",
    usage_categorie: "Privé",
    nom_proprietaire: "",
    phone_proprietaire: "",
    adresse_proprietaire: "",
    date_expiration_vignette: "",
    date_expiration_assurance: "",
    date_prochain_controle: "",
    montant_vignette: 0,
    devise_vignette: "CDF",
    montant_assurance: 0,
    numero_police_assurance: ""
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const autoGeneratePlate = async (usage: string) => {
    setIsGenerating(true);
    let isUnique = false;
    let newPlate = "";
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      newPlate = generatePlate(usage);
      isUnique = await adminService.isPlaqueUnique(newPlate);
      attempts++;
    }

    setFormData(prev => ({ ...prev, plaque: newPlate }));
    setIsGenerating(false);
  };

  // Auto-generate VIN on open
  useEffect(() => {
    if (isOpen && !formData.chassis_no) {
      setFormData(prev => ({ ...prev, chassis_no: generateVIN() }));
    }
  }, [isOpen]);

  const handleManualVIN = () => {
    setFormData(prev => ({ ...prev, chassis_no: generateVIN() }));
  };

  const handlePuissanceChange = (val: string) => {
    if (val === "manual") {
      setIsManualPuissance(true);
      setFormData({ ...formData, puissance: "" });
    } else {
      setIsManualPuissance(false);
      setFormData({ ...formData, puissance: val });
    }
  };

  const handleUsageChange = (val: string) => {
    setFormData(prev => ({ ...prev, usage_categorie: val }));
    autoGeneratePlate(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createVehicule(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        plaque: "",
        marque: "",
        modele: "",
        annee: new Date().getFullYear(),
        chassis_no: "",
        energie: "Essence",
        puissance: "",
        ptac: "",
        usage_categorie: "Privé",
        nom_proprietaire: "",
        phone_proprietaire: "",
        adresse_proprietaire: "",
        date_expiration_vignette: "",
        date_expiration_assurance: "",
        date_prochain_controle: "",
        montant_vignette: 0,
        devise_vignette: "CDF",
        montant_assurance: 0,
        numero_police_assurance: ""
      });
      setIsManualPuissance(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Certification Carte Rose">
      <form onSubmit={handleSubmit} className="space-y-8 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar animate-fade-in pb-4">
        
        {/* Illustration Dynamique Premium */}
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-50 border border-slate-100 p-8 flex items-center justify-center h-56 sm:h-64 shadow-inner">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none"></div>
           <img 
             src={getUsageIllustration(formData.usage_categorie)} 
             alt="Aperçu véhicule" 
             className="w-full h-full object-contain filter drop-shadow-2xl translate-y-2 group-hover:scale-110 group-hover:translate-y-0 transition-all duration-700"
           />
           <div className="absolute top-6 right-6">
             <div className="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white/50 text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
               Validation Système RoutiPass
             </div>
           </div>
        </div>

        {/* Section 1: Propriétaire (Identité Civile) */}
        <div className="glass-card rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Détenteur Légal</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom Complet du Propriétaire</label>
            <div className="relative">
              <Input 
                required 
                placeholder="Identité officielle" 
                value={formData.nom_proprietaire} 
                onChange={(e) => setFormData({...formData, nom_proprietaire: e.target.value})} 
                className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl focus:ring-blue-500 font-bold px-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Téléphonique</label>
              <div className="relative">
                <Input 
                  required 
                  placeholder="+243..." 
                  value={formData.phone_proprietaire} 
                  onChange={(e) => setFormData({...formData, phone_proprietaire: e.target.value})} 
                  className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl focus:ring-blue-500 font-bold pl-10"
                />
                <Phone className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Domiciliation</label>
              <div className="relative">
                <Input 
                  required 
                  placeholder="Kinshasa, Gombe..." 
                  value={formData.adresse_proprietaire} 
                  onChange={(e) => setFormData({...formData, adresse_proprietaire: e.target.value})} 
                  className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl focus:ring-blue-500 font-bold pl-10"
                />
                <MapPin className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Identité du véhicule (Fiche Technique) */}
        <div className="glass-card rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Spécifications Machine</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Immatriculation (Plaque)</label>
              <div className="relative group/field">
                <Input 
                  readOnly
                  placeholder="AUTO-GÉNÉRÉ" 
                  value={formData.plaque} 
                  className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-indigo-500 font-black tracking-[0.2em] text-center cursor-default"
                />
                <button 
                  type="button"
                  onClick={() => handleCopy(formData.plaque)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100"
                  title="Copier le numéro"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                {isGenerating && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                <span>Numéro Châssis (VIN)</span>
                <button type="button" onClick={handleManualVIN} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 normal-case font-bold">
                  <RefreshCcw className="w-3 h-3" /> Auto
                </button>
              </label>
              <div className="relative">
                <Input 
                  required 
                  maxLength={17}
                  placeholder="UNIQUE VIN" 
                  value={formData.chassis_no} 
                  onChange={(e) => setFormData({...formData, chassis_no: e.target.value.toUpperCase()})} 
                  className="h-12 bg-white border-slate-100 rounded-xl focus:ring-indigo-500 font-bold tracking-widest pl-10"
                />
                <Hash className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Marque</label>
              <Input 
                required 
                placeholder="Toyota" 
                value={formData.marque} 
                onChange={(e) => setFormData({...formData, marque: e.target.value})} 
                className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modèle</label>
              <Input 
                required 
                placeholder="Corolla" 
                value={formData.modele} 
                onChange={(e) => setFormData({...formData, modele: e.target.value})} 
                className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mise en Circ.</label>
              <Input 
                required 
                type="number"
                value={formData.annee} 
                onChange={(e) => setFormData({...formData, annee: parseInt(e.target.value) || 2024})} 
                className="h-12 bg-[#F8FAFC] border-slate-100 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Caractéristiques & Validité */}
        <div className="glass-card rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Statut Opérationnel</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <CustomSelect
                label="Énergie"
                options={[
                  { label: "Essence", value: "Essence" },
                  { label: "Diesel", value: "Diesel" },
                  { label: "Hybride", value: "Hybride" },
                  { label: "Électrique", value: "Électrique" },
                ]}
                value={formData.energie}
                onChange={(val) => setFormData({...formData, energie: val})}
              />
            </div>
            
            <div className="space-y-1">
              {!isManualPuissance ? (
                <CustomSelect
                  label="Puissance"
                  options={[
                    { label: "10-20 CV", value: "10-20 CV" },
                    { label: "30-60 CV", value: "30-60 CV" },
                    { label: "60-100 CV", value: "60-100 CV" },
                    { label: "100-200 CV", value: "100-200 CV" },
                    { label: "+ Saisie Manuelle", value: "manual" },
                  ]}
                  value={formData.puissance}
                  onChange={handlePuissanceChange}
                  placeholder="Specs..."
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Puissance (CV)</label>
                  <Input 
                    required 
                    autoFocus
                    placeholder="Ex: 500 CV" 
                    value={formData.puissance} 
                    onChange={(e) => setFormData({...formData, puissance: e.target.value})} 
                    className="h-12 bg-white border-slate-100 rounded-xl font-bold"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">PTAC (Charge)</label>
              <div className="relative">
                <Input 
                  placeholder="2500 kg" 
                  value={formData.ptac} 
                  onChange={(e) => setFormData({...formData, ptac: e.target.value})} 
                  className="h-12 bg-white border-slate-100 rounded-xl font-bold pl-10"
                />
                <Weight className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <CustomSelect
                label="Cat. Usage"
                options={[
                  { label: "Privé", value: "Privé" },
                  { label: "Public", value: "Public" },
                  { label: "Commerciaux", value: "Commerciaux" },
                  { label: "Moto-taxi", value: "Moto-taxi" },
                ]}
                value={formData.usage_categorie}
                onChange={handleUsageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Vignette Fiscale
              </label>
              <Input 
                required 
                type="date" 
                value={formData.date_expiration_vignette} 
                onChange={(e) => setFormData({...formData, date_expiration_vignette: e.target.value})} 
                className="h-12 bg-white border-slate-100 rounded-xl font-bold px-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Assurance (EXP)
              </label>
              <Input 
                required 
                type="date" 
                value={formData.date_expiration_assurance} 
                onChange={(e) => setFormData({...formData, date_expiration_assurance: e.target.value})} 
                className="h-12 bg-white border-slate-100 rounded-xl font-bold px-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Contrôle Tech.
              </label>
              <Input 
                required 
                type="date" 
                value={formData.date_prochain_controle} 
                onChange={(e) => setFormData({...formData, date_prochain_controle: e.target.value})} 
                className="h-12 bg-white border-slate-100 rounded-xl font-bold px-4"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Données Financières */}
        <div className="glass-card rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Données Financières</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Montant</label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={formData.montant_vignette} 
                        onChange={(e) => setFormData({...formData, montant_vignette: parseFloat(e.target.value) || 0})} 
                        className="h-12 bg-white border-slate-100 rounded-xl font-bold"
                      />
                    </div>
                    <div className="w-28">
                      <CustomSelect
                        options={[
                          { label: "CDF", value: "CDF" },
                          { label: "USD", value: "USD" },
                        ]}
                        value={formData.devise_vignette}
                        onChange={(val) => setFormData({...formData, devise_vignette: val})}
                      />
                    </div>
                  </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Détails Assurance</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="number"
                    placeholder="Prime (CDF)" 
                    value={formData.montant_assurance} 
                    onChange={(e) => setFormData({...formData, montant_assurance: parseFloat(e.target.value) || 0})} 
                    className="h-12 bg-white border-slate-100 rounded-xl font-bold"
                  />
                  <Input 
                    placeholder="N° Police" 
                    value={formData.numero_police_assurance} 
                    onChange={(e) => setFormData({...formData, numero_police_assurance: e.target.value})} 
                    className="h-12 bg-white border-slate-100 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-xl py-4 z-10">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs">Annuler</Button>
          <Button type="submit" className="flex-1 h-14 rounded-2xl bg-[#1e3a8a] text-white font-black tracking-widest shadow-2xl shadow-blue-900/20 hover:bg-[#152e6f] transition-all" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GÉNÉRER CARTE ROSE"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

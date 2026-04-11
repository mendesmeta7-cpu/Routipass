"use client";

import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Vehicule } from "@/types";
import { getValidityStatus, getUsageIllustration } from "@/utils/vehicleUtils";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Info, CreditCard } from "lucide-react";

interface VehiclePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicule: Vehicule | null;
  onConfirm: () => void;
  loading?: boolean;
  error?: string;
}

export function VehiclePreviewModal({ isOpen, onClose, vehicule, onConfirm, loading, error }: VehiclePreviewModalProps) {
  if (!vehicule) return null;

  const assuranceStatus = getValidityStatus(vehicule.date_expiration_assurance);
  const vignetteStatus = getValidityStatus(vehicule.date_expiration_vignette);
  const controleStatus = getValidityStatus(vehicule.date_prochain_controle);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Détails du Véhicule">
      <div className="flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Header - Image (Pas de superposition) */}
        <div className="pt-2 animate-in fade-in duration-500">
          <div className="h-44 sm:h-56 flex items-center justify-center shrink-0">
             <img 
               src={getUsageIllustration(vehicule.usage_categorie)} 
               alt={vehicule.usage_categorie} 
               className="w-full h-full object-contain transition-transform hover:scale-105 duration-500"
             />
          </div>
        </div>
        
        {/* Nouvelle Carte d'Identité Propriétaire & Plaque */}
        <div className="bg-slate-50 rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex items-center justify-between w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-1">Propriétaire</span>
              <span className="text-base font-black text-[#1e3b6a] leading-none mb-1">{vehicule.nom_proprietaire}</span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight">{vehicule.phone_proprietaire}</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 truncate block max-w-[150px]">{vehicule.adresse_proprietaire}</span>
           </div>
           
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg leading-none">🇨🇩</span>
                <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm bg-white uppercase tracking-widest">CGO</span>
              </div>
              <span className="text-[15px] font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 tracking-wider shadow-inner">
                {vehicule.plaque}
              </span>
           </div>
        </div>

        {/* Admin Data Section */}
        <div className="space-y-4 bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-[#1e3b6a] tracking-tight">Données administratives</h3>
          </div>
          
          <ul className="grid grid-cols-1 gap-1 text-sm text-slate-600 pl-2">
            <li className="flex gap-2"><span>•</span> <span>Marque : <span className="font-semibold text-slate-900 uppercase">{vehicule.marque}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>Modèle : <span className="font-semibold text-slate-900">{vehicule.modele}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>Année : <span className="font-semibold text-slate-900">{vehicule.annee}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>Châssis : <span className="font-mono font-semibold text-slate-900 tracking-wider uppercase">{vehicule.chassis_no}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>Énergie : <span className="font-semibold text-slate-900 uppercase">{vehicule.energie}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>Puissance : <span className="font-semibold text-slate-900 uppercase">{vehicule.puissance}</span></span></li>
            <li className="flex gap-2"><span>•</span> <span>PTAC : <span className="font-semibold text-slate-900">{vehicule.ptac}</span></span></li>
            {vehicule.numero_police_assurance && (
              <li className="flex gap-2"><span>•</span> <span>Police Assurance : <span className="font-mono font-semibold text-slate-900 uppercase">{vehicule.numero_police_assurance}</span></span></li>
            )}
            <li className="flex gap-2 mt-1">
                <span>•</span> 
                <span className="flex items-center gap-2">
                    Catégorie : 
                    <span className="bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-medium">
                        {vehicule.usage_categorie}
                    </span>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                </span>
            </li>
          </ul>
        </div>

        {/* Validity & Payment Section */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-black text-[#1e3b6a] tracking-tight">État des redevances et validité</h3>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {/* Assurance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">Assurance</span>
                  <span className="text-slate-600">Expire le {new Date(vehicule.date_expiration_assurance).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="w-3 h-3 rounded-full shadow-sm border border-white" style={{ backgroundColor: assuranceStatus.color }} />
              </div>
              <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Prime: {vehicule.montant_assurance?.toLocaleString() || 0} CDF</span>
                {new Date(vehicule.date_expiration_assurance) > new Date() ? (
                  <span className="text-[10px] font-black text-emerald-600 uppercase italic">Document encore valide</span>
                ) : (
                  <Button variant="outline" className="h-7 px-3 rounded-lg text-[10px] font-black border-rose-200 text-rose-600 hover:bg-rose-50 transition-all uppercase">Renouveler</Button>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full my-1" />

            {/* Vignette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">Vignette</span>
                  <span className="text-slate-600">Expire le {new Date(vehicule.date_expiration_vignette).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="w-3 h-3 rounded-full shadow-sm border border-white" style={{ backgroundColor: vignetteStatus.color }} />
              </div>
              <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Taxe: {vehicule.montant_vignette?.toLocaleString() || 0} {vehicule.devise_vignette}</span>
                {new Date(vehicule.date_expiration_vignette) > new Date() ? (
                  <span className="text-[10px] font-black text-emerald-600 uppercase italic">Document encore valide</span>
                ) : (
                  <Button variant="outline" className="h-7 px-3 rounded-lg text-[10px] font-black border-amber-200 text-amber-600 hover:bg-amber-50 transition-all uppercase">Payer Vignette</Button>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full my-1" />

            {/* Contrôle Technique */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">Contrôle Tech.</span>
                <span className="text-slate-600">RDV le {new Date(vehicule.date_prochain_controle).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="w-3 h-3 rounded-full shadow-sm border border-white" style={{ backgroundColor: controleStatus.color }} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center text-sm font-bold animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 pb-2">
          <Button 
            onClick={onConfirm} 
            disabled={loading}
            className="w-full h-12 bg-[#FFD700] hover:bg-[#E6C200] text-slate-900 font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            {loading ? "Chargement..." : "Enregistrer →"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

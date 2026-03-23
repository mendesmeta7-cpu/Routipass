"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin";
import { Loader2, ShieldCheck, Fingerprint, Camera, Copy, CheckCircle2, UserPlus, Info } from "lucide-react";
import Image from "next/image";

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAgentModal({ isOpen, onClose, onSuccess }: AddAgentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    nomComplet: "",
    matricule: "",
  });
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    setStep(1);
    setFormData({ nomComplet: "", matricule: "" });
    setPhotoFile(undefined);
    setAgentResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminService.enrollNewAgent({ ...formData, photoFile });
      setAgentResult(result);
      onSuccess();
      setStep(2);
    } catch (error: any) {
      console.error(error);
      alert("Erreur lors de l'enrôlement de l'agent");
    } finally {
      setLoading(false);
    }
  };

  const currentPhotoUrl = photoFile ? URL.createObjectURL(photoFile) : null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={step === 1 ? "Enrôler un Agent" : "Agent Enrôlé avec Succès"}>
      <div className="animate-fade-in p-2">
        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nouvelle Entrée</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Accréditation du personnel de terrain</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom Complet</label>
              <div className="relative">
                <Input 
                  required 
                  placeholder="EX: KABUYA TSHILOMBO JEAN" 
                  className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-amber-500 font-bold px-5 uppercase"
                  value={formData.nomComplet} 
                  onChange={(e) => setFormData({...formData, nomComplet: e.target.value.toUpperCase()})} 
                />
                <UserPlus className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Numéro Matricule</label>
              <div className="relative">
                <Input 
                  required 
                  placeholder="EX: MAT-89021" 
                  className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-amber-500 font-black text-slate-900 uppercase tracking-wider"
                  value={formData.matricule} 
                  onChange={(e) => setFormData({...formData, matricule: e.target.value.toUpperCase()})} 
                />
                <Fingerprint className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Photo de l'Agent</label>
              <div className="relative group">
                <Input 
                  required
                  type="file" 
                  accept="image/*"
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition-all cursor-pointer"
                  onChange={(e) => setPhotoFile(e.target.files?.[0])} 
                />
                <Camera className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-amber-400" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={handleClose} className="flex-1 h-14 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs">Annuler</Button>
              <Button type="submit" className="flex-1 h-14 rounded-2xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-black tracking-widest shadow-xl shadow-blue-900/20" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GÉNÉRER LES ACCÈS"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center animate-fade-in space-y-6">
            
            <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-sm font-medium">
                <strong className="block font-black mb-1">Action Requise</strong>
                Prenez une capture d'écran de ces informations et transmettez-la à l'agent. Le code PIN est provisoire.
              </div>
            </div>

            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
              <div className="h-24 bg-[#1E3A8A] flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-white/20 absolute top-4 right-4" />
                <span className="text-white font-black tracking-widest uppercase text-sm">Badge Officiel</span>
              </div>
              
              <div className="px-6 pb-8 pt-0 flex flex-col items-center relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden -mt-12 mb-4 relative z-10">
                  {currentPhotoUrl ? (
                    <img src={currentPhotoUrl} alt="Photo agent" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><UserPlus className="w-8 h-8" /></div>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight leading-tight mb-1">
                  {agentResult?.nom}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 border border-slate-200 px-3 py-1 rounded-full bg-slate-50">
                  MATRICULE: {agentResult?.matricule}
                </p>

                <div className="w-full space-y-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">ID AGENT</label>
                    <div className="text-lg font-black text-[#1E3A8A] tracking-wider">{agentResult?.agent_id}</div>
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(agentResult?.agent_id || "");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-[#1E3A8A] hover:border-[#1E3A8A]/30 transition-all"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CODE PIN PROVISOIRE</label>
                    <div className="text-2xl font-black text-slate-900 tracking-[0.2em]">{agentResult?.code_pin}</div>
                  </div>
                </div>

              </div>
            </div>

            <Button onClick={handleClose} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black tracking-widest shadow-xl">
              TERMINER
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

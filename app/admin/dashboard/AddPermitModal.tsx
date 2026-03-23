"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin";
import { Loader2, UserPlus, ShieldCheck, Fingerprint, Calendar, Camera } from "lucide-react";

interface AddPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPermitModal({ isOpen, onClose, onSuccess }: AddPermitModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_permis: "",
    nom: "",
    prenom: "",
    categorie_permis: "B",
    date_naissance: ""
  });
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createPermis({ ...formData, photo_file: photoFile });
      onSuccess();
      onClose();
      setFormData({
        numero_permis: "",
        nom: "",
        prenom: "",
        categorie_permis: "B",
        date_naissance: ""
      });
      setPhotoFile(undefined);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Enrôlement Nouveau Permis">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in p-2">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dossier Conducteur</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Saisie des informations officielles</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Numéro de Permis Unique</label>
          <div className="relative">
            <Input 
              required 
              placeholder="EX: CD-123456" 
              className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 font-black text-slate-900 placeholder:font-medium uppercase tracking-wider"
              value={formData.numero_permis} 
              onChange={(e) => setFormData({...formData, numero_permis: e.target.value.toUpperCase()})} 
            />
            <Fingerprint className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom</label>
            <Input 
              required 
              placeholder="NOM" 
              className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 font-bold px-5 uppercase"
              value={formData.nom} 
              onChange={(e) => setFormData({...formData, nom: e.target.value.toUpperCase()})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom</label>
            <Input 
              required 
              placeholder="PRÉNOM" 
              className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 font-bold px-5 uppercase"
              value={formData.prenom} 
              onChange={(e) => setFormData({...formData, prenom: e.target.value.toUpperCase()})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Catégorie</label>
            <div className="relative">
              <select 
                className="flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                value={formData.categorie_permis}
                onChange={(e) => setFormData({...formData, categorie_permis: e.target.value})}
              >
                <option value="A">A (Moto)</option>
                <option value="B">B (Voiture)</option>
                <option value="C">C (Lourd)</option>
                <option value="D">D (Public)</option>
              </select>
              <ShieldCheck className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Naissance</label>
            <div className="relative">
              <Input 
                required 
                type="date" 
                className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 font-bold px-5"
                value={formData.date_naissance} 
                onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pièce Jointe (Photo)</label>
          <div className="relative group">
            <Input 
              type="file" 
              accept="image/*"
              className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
              onChange={(e) => setPhotoFile(e.target.files?.[0])} 
            />
            <Camera className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-400" />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs">Annuler</Button>
          <Button type="submit" className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black tracking-widest shadow-xl shadow-indigo-100" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENREGISTRER"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

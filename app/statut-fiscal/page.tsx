"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, AlertCircle, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, History, MapPin, Camera, AlertTriangle, Eye } from 'lucide-react';
import { conducteurService } from '@/services/conducteurs';
import { authService } from '@/services/auth';
import type { Conducteur, Vehicule } from '@/types';
import { getUsageIllustration, getValidityStatus, getCountdownStatus, calculateDaysRemaining } from '@/utils/vehicleUtils';
import { useSearchParams } from 'next/navigation';

type TabType = 'OBLIGATIONS' | 'AMENDES';
type SubSectionType = 'VIGNETTE' | 'ASSURANCE' | 'CONTROLE_TECHNIQUE' | 'AMENDE' | null;

export default function StatutFiscal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('OBLIGATIONS');
  const [activeSection, setActiveSection] = useState<SubSectionType>(null);
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string | null>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARTE' | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [selectedFine, setSelectedFine] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const profile = await conducteurService.getProfileById(user.id);
        if (profile) {
          const [vehiculesData, finesData] = await Promise.all([
            conducteurService.getVehicules(profile.id),
            conducteurService.getFinesIssued(profile.id)
          ]);
          setVehicules(vehiculesData);
          setFines(finesData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Handle Query Params for Fast Path (Notifications)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const fineId = searchParams.get('fineId');
    const paymentFlowParam = searchParams.get('paymentFlow');

    if (tab === 'AMENDES') {
      setActiveTab('AMENDES');
    }

    if (fineId && fines.length > 0) {
      const fine = fines.find(f => f.id === fineId);
      if (fine) {
        setSelectedFine(fine);
        if (paymentFlowParam === 'true') {
          setActiveSection('AMENDE');
          setShowPaymentFlow(true);
        }
      }
    }
  }, [searchParams, fines]);

  const selectVehicleForPayment = (vId: string, section: SubSectionType) => {
    const vehicule = vehicules.find(v => v.id === vId);
    if (!vehicule) return;

    const expDate = section === 'VIGNETTE' ? vehicule.date_expiration_vignette : vehicule.date_expiration_assurance;
    const daysLeft = calculateDaysRemaining(expDate);

    if (daysLeft > 0) {
      setToastMessage("Le document est encore valide. Renouvellement impossible.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    setSelectedVehiculeId(vId);
    setActiveSection(section);
    setShowPaymentFlow(true);
  };

  const selectFineForPayment = (fine: any) => {
    setSelectedFine(fine);
    setActiveSection('AMENDE');
    setShowPaymentFlow(true);
  };


  const getSelectedVehicule = () => vehicules.find(v => v.id === selectedVehiculeId);

  // === RENDER HELPERS ===

  const renderPaymentPage = () => {
    const vehicule = getSelectedVehicule();
    if (!vehicule && activeSection !== 'AMENDE') return null;

    const isVignette = activeSection === 'VIGNETTE';
    const isAmende = activeSection === 'AMENDE';

    const amountToPay = isAmende ? (selectedFine?.montant || 0) : isVignette ? (vehicule?.montant_vignette || 0) : (vehicule?.montant_assurance || 0);
    const currencyToUse = isAmende ? (selectedFine?.devise || 'CDF') : isVignette ? (vehicule?.devise_vignette || 'USD') : 'USD';
    const title = isAmende ? 'Amende' : isVignette ? 'Vignette' : 'Assurance';

    return (
      <div className="flex flex-col h-full bg-[#f8fbff] animate-in slide-in-from-right duration-300">
        <div className="bg-[#e9b11e] pt-12 pb-6 px-6 md:px-12 lg:px-24 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowPaymentFlow(false);
                if (activeSection === 'AMENDE') setActiveSection(null);
              }}
              className="bg-white/30 p-2 rounded-full hover:bg-white/50 transition"
            >
              <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <h1 className="text-xl font-black text-black tracking-tight flex-1 truncate">Paiement {title}</h1>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-12 lg:px-24 py-6 pb-24">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            {activeSection === 'AMENDE' && selectedFine ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 p-2 text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1e3b6a] text-lg">{selectedFine.nature_infraction}</h3>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">Amende #{selectedFine.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Montant à régler</span>
                  <span className="text-2xl font-black text-red-600">{selectedFine.montant} {selectedFine.devise}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Délai Légal</span>
                  <span className="text-sm font-black text-[#1e3b6a]">{selectedFine.delai_paiement} JOURS</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 p-2">
                    <img src={getUsageIllustration(vehicule?.usage_categorie || 'Privé')} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1e3b6a] text-lg">{vehicule?.marque} {vehicule?.modele}</h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{vehicule?.plaque}</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-gray-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Montant à régler</span>
                  <span className="text-2xl font-black text-red-600">{amountToPay} {currencyToUse}</span>
                </div>
              </>
            )}
          </div>

          {/* Payment Methods */}
          <h3 className="text-sm font-black text-[#1e3b6a] mt-8 mb-4 uppercase tracking-widest">Moyen de paiement</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPaymentMethod('MOBILE_MONEY')}
              className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${paymentMethod === 'MOBILE_MONEY' ? 'border-blue-500 shadow-md' : 'border-transparent shadow-sm'}`}
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="font-black text-[#1e3b6a]">Mobile Money</span>
                <span className="text-xs text-gray-400 font-medium">Mpesa, Airtel, Orange</span>
              </div>
              {paymentMethod === 'MOBILE_MONEY' && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
            </button>

            <button
              onClick={() => setPaymentMethod('CARTE')}
              className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${paymentMethod === 'CARTE' ? 'border-blue-500 shadow-md' : 'border-transparent shadow-sm'}`}
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="font-black text-[#1e3b6a]">Carte Bancaire</span>
                <span className="text-xs text-gray-400 font-medium">Visa, Mastercard</span>
              </div>
              {paymentMethod === 'CARTE' && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-white p-6 md:px-12 lg:px-24 border-t border-gray-100 shrink-0">
          <button
            disabled={!paymentMethod}
            className="w-full bg-[#e9b11e] text-black font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
          >
            Procéder au paiement
          </button>
        </div>
      </div>
    );
  };

  const renderVehiclesList = (section: 'VIGNETTE' | 'ASSURANCE') => {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setActiveSection(null)} className="p-2 -ml-2 hover:bg-blue-50 rounded-full text-[#1e3b6a]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-[#1e3b6a] tracking-tight truncate">Plaques liées ({section})</h2>
        </div>

        {vehicules.length === 0 ? (
          <div className="text-center text-gray-400 py-10 font-medium text-sm">
            Aucun véhicule enregistré.
          </div>
        ) : (
          vehicules.map((v, idx) => {
            const expDate = section === 'VIGNETTE' ? v.date_expiration_vignette : v.date_expiration_assurance;
            const status = getValidityStatus(expDate);

            return (
              <button
                key={v.id}
                onClick={() => selectVehicleForPayment(v.id, section)}
                className="w-full text-left bg-white rounded-3xl p-3 sm:p-5 shadow-sm border border-gray-100 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 relative transition-all hover:shadow-md hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}
              >
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
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300" style={{ backgroundColor: status.bg, borderColor: status.border }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }}></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: status.text }}>
                        {section} • {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end shrink-0 sm:pl-2 mt-1 sm:mt-0">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    );
  };

  const renderControleTechnique = () => {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setActiveSection(null)} className="p-2 -ml-2 hover:bg-blue-50 rounded-full text-[#1e3b6a]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-[#1e3b6a] tracking-tight">Validité Contrôle Tech.</h2>
        </div>

        {vehicules.length === 0 ? (
          <div className="text-center text-gray-400 py-10 font-medium text-sm">
            Aucun véhicule enregistré.
          </div>
        ) : (
          vehicules.map(v => {
            const expDate = v.date_prochain_controle;
            const status = getValidityStatus(expDate);
            const countdown = getCountdownStatus(expDate);

            return (
              <div
                key={v.id}
                className="w-full bg-white rounded-[2.5rem] p-6 shadow-sm border flex flex-col gap-5 relative overflow-hidden transition-all duration-300 hover:shadow-md"
                style={{ borderColor: countdown.border }}
              >
                {/* Background Accent */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-bl-[5rem] opacity-10 -z-0" 
                  style={{ backgroundColor: countdown.accent }}
                ></div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-1">
                      {v.plaque}
                    </span>
                    <h4 className="font-black text-[#1e3b6a] text-lg leading-none">{v.marque} <span className="text-gray-400 font-bold">{v.modele}</span></h4>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: countdown.bg }}>
                    {countdown.status === 'safe' ? (
                      <ShieldCheck className="w-7 h-7" style={{ color: countdown.color }} />
                    ) : countdown.status === 'warning' ? (
                      <AlertCircle className="w-7 h-7" style={{ color: countdown.color }} />
                    ) : (
                      <AlertTriangle className="w-7 h-7" style={{ color: countdown.color }} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100">
                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest block mb-1">Échéance</span>
                    <span className="font-black text-[#1e3b6a] text-sm italic">
                      {expDate ? new Date(expDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date non définie'}
                    </span>
                  </div>

                  <div className="p-4 rounded-[1.5rem] flex flex-col items-center justify-center border" style={{ backgroundColor: countdown.bg, borderColor: countdown.border }}>
                    <span className="text-[10px] uppercase font-black tracking-widest block mb-1" style={{ color: countdown.text }}>Décompte</span>
                    <span className="font-black text-xl leading-none animate-pulse" style={{ color: countdown.color }}>
                      {countdown.label}
                    </span>
                  </div>
                </div>

                {/* Progress-like indicator */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1 relative z-10">
                  <div 
                    className="h-full transition-all duration-1000 ease-out rounded-full"
                    style={{ 
                      width: countdown.status === 'expired' ? '100%' : `${Math.min(100, Math.max(5, (countdown.days / 365) * 100))}%`,
                      backgroundColor: countdown.color 
                    }}
                  ></div>
                </div>

                {countdown.status !== 'safe' && (
                  <button className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-gray-50" style={{ borderColor: countdown.border, color: countdown.text }}>
                    Prendre un rendez-vous d'inspection
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    );
  }

  const renderAmendesTab = () => {
    const pendingFines = fines.filter(f => f.statut === 'INPAYEE');
    const historianFines = fines.filter(f => f.statut === 'PAYEE');

    const FineCard = ({ fine, idx }: { fine: any, idx: number }) => (
      <button
        key={fine.id}
        onClick={() => setSelectedFine(fine)}
        className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 mb-4 hover:shadow-md transition-all text-left animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: `${idx * 100}ms` }}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${fine.statut === 'PAYEE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {fine.statut === 'PAYEE' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-black text-[#1e3b6a] text-sm truncate">{fine.nature_infraction}</h4>
            <span className="font-black text-[#1e3b6a] text-sm">{fine.montant} {fine.devise}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-gray-400">{new Date(fine.date_emission).toLocaleDateString()}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="text-[10px] font-bold text-gray-400 capitalize">{fine.statut?.toLowerCase()}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>
    );

    return (
      <div className="flex flex-col mt-6">
        {/* Section En attente */}
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1e3b6a]/50 mb-4 px-2">Amendes en attente ({pendingFines.length})</h3>
        {pendingFines.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 mb-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-emerald-800">Félicitations !</p>
            <p className="text-xs font-bold text-emerald-600/70 mt-1">Aucune amende impayée sur votre permis.</p>
          </div>
        ) : (
          pendingFines.map((f, idx) => <FineCard key={f.id} fine={f} idx={idx} />)
        )}

        {/* Section Historique */}
        {historianFines.length > 0 && (
          <>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1e3b6a]/50 mb-4 px-2 mt-4">Historique de paiement ({historianFines.length})</h3>
            {historianFines.map((f, idx) => <FineCard key={f.id} fine={f} idx={idx} />)}
          </>
        )}

        {/* Empty state if nothing at all */}
        {fines.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <History className="w-16 h-16 text-gray-300 mb-4" />
            <p className="font-bold text-gray-400">Aucune infraction enregistrée.</p>
          </div>
        )}
      </div>
    );
  };

  const renderFineDetailModal = () => {
    if (!selectedFine || activeSection === 'AMENDE') return null;

    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div
          className="absolute inset-0"
          onClick={() => setSelectedFine(null)}
        />
        <div className="relative bg-white rounded-t-[3rem] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-20 duration-500">
          <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${selectedFine.statut === 'PAYEE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e3b6a] leading-tight">{selectedFine.nature_infraction}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedFine.statut === 'PAYEE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedFine.statut}
                </span>
                <span className="text-[10px] font-bold text-gray-400">Réf: {selectedFine.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Montant</span>
                <span className="font-black text-[#1e3b6a]">{selectedFine.montant} {selectedFine.devise}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Délai de paiement</span>
                <span className="font-black text-rose-600">{selectedFine.delai_paiement} JOURS</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl col-span-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date émission</span>
                <span className="font-black text-[#1e3b6a]">{new Date(selectedFine.date_emission).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-[#1e3b6a]/5 p-4 rounded-2xl flex items-center gap-4 border border-[#1e3b6a]/10">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#1e3b6a]/10">
                <img src={getUsageIllustration(selectedFine.vehicules?.usage_categorie || 'Privé')} alt="" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Véhicule impliqué</p>
                <p className="font-black text-[#1e3b6a] text-sm uppercase">{selectedFine.vehicules?.marque} {selectedFine.vehicules?.modele} • {selectedFine.vehicules?.plaque}</p>
              </div>
            </div>

            {/* Photo Section */}
            {selectedFine.photo_url && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#1e3b6a]/50 mb-1">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Preuve photographique</span>
                </div>
                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={selectedFine.photo_url} alt="Preuve infraction" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Remarks & GPS */}
            <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Notes de l'Agent</span>
              </div>
              <p className="text-sm font-bold text-[#1e3b6a] leading-relaxed italic">
                "{selectedFine.remarques || 'Aucune remarque additionnelle enregistrée par l\'agent.'}"
              </p>

              {selectedFine.gps_lat && (
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedFine.gps_lat},${selectedFine.gps_long}`, '_blank')}
                  className="mt-4 flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest hover:translate-x-1 transition-transform"
                >
                  <MapPin className="w-4 h-4" />
                  Voir le lieu de l'infraction
                </button>
              )}
            </div>

            {/* Action Button */}
            {selectedFine.statut === 'INPAYEE' ? (
              <button
                onClick={() => selectFineForPayment(selectedFine)}
                className="w-full bg-[#e9b11e] text-black font-black text-sm uppercase tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-yellow-500/20 active:scale-95 transition-all mt-4"
              >
                Payer l'amende maintenant
              </button>
            ) : (
              <div className="w-full bg-emerald-100 text-emerald-700 font-black text-center py-5 rounded-[1.5rem] flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                AMENDE RÉGLÉE
              </div>
            )}

            <button
              onClick={() => setSelectedFine(null)}
              className="w-full py-4 text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    if (activeTab === 'AMENDES') {
      return renderAmendesTab();
    }

    if (activeSection === 'VIGNETTE' || activeSection === 'ASSURANCE') {
      return renderVehiclesList(activeSection);
    }

    if (activeSection === 'CONTROLE_TECHNIQUE') {
      return renderControleTechnique();
    }

    return (
      <div className="grid grid-cols-1 gap-4 mt-6">
        <button
          onClick={() => setActiveSection('VIGNETTE')}
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex items-center justify-between hover:-translate-y-1 transition-transform group"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-black text-[#1e3b6a] text-lg">Vignette</span>
              <span className="text-xs text-[#1e3b6a]/50 font-bold uppercase tracking-widest mt-0.5">Renouvellement annuel</span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#e9b11e] transition-colors" />
        </button>

        <button
          onClick={() => setActiveSection('ASSURANCE')}
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex items-center justify-between hover:-translate-y-1 transition-transform group"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-black text-[#1e3b6a] text-lg">Assurance</span>
              <span className="text-xs text-[#1e3b6a]/50 font-bold uppercase tracking-widest mt-0.5">Couverture véhicule</span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#e9b11e] transition-colors" />
        </button>

        <button
          onClick={() => setActiveSection('CONTROLE_TECHNIQUE')}
          className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex items-center justify-between hover:-translate-y-1 transition-transform group"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-orange-500" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-black text-[#1e3b6a] text-lg">Contrôle Technique</span>
              <span className="text-xs text-[#1e3b6a]/50 font-bold uppercase tracking-widest mt-0.5">Inspection périodique</span>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#e9b11e] transition-colors" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fbff]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showPaymentFlow) {
    return (
      <main className="w-full min-h-screen bg-white flex flex-col relative overflow-hidden">
        {renderPaymentPage()}
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#f8fbff] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
      {/* HEADER */}
      <div className="bg-[#1e3b6a] pt-12 pb-6 px-6 md:px-12 lg:px-24 shrink-0">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">Statut Fiscal</h1>
        </div>

        {/* TABS */}
        <div className="bg-black/20 p-1.5 rounded-2xl flex relative">
          <button
            onClick={() => { setActiveTab('OBLIGATIONS'); setActiveSection(null); }}
            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${activeTab === 'OBLIGATIONS' ? 'text-[#1e3b6a]' : 'text-white/60 hover:text-white'}`}
          >
            Obligations Routières
          </button>
          <button
            onClick={() => { setActiveTab('AMENDES'); setActiveSection(null); }}
            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${activeTab === 'AMENDES' ? 'text-[#1e3b6a]' : 'text-white/60 hover:text-white'}`}
          >
            Amendes ({fines.filter(f => f.statut === 'INPAYEE').length})
          </button>

          {/* Tab gliding background */}
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#e9b11e] rounded-xl transition-all duration-300"
            style={{ left: activeTab === 'OBLIGATIONS' ? '6px' : 'calc(50%)' }}
          ></div>
        </div>
      </div>

      <div className="flex-1 px-6 md:px-12 lg:px-24 pb-20 relative">
        {renderSectionContent()}
        {renderFineDetailModal()}

        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 w-max max-w-[90%] text-center">
            {toastMessage}
          </div>
        )}
      </div>
    </main>
  );
}

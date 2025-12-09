import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionService, Transaction, TrackerStep } from '../types';
import { Loader2, ArrowRight, Gift, TrendingUp, ShieldCheck } from 'lucide-react';
import { Tracker } from './Tracker';

export const RightSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const loadTx = () => {
      const tx = TransactionService.getActive();
      setActiveTx(tx);
    };
    loadTx();
    window.addEventListener('storage', loadTx);
    return () => window.removeEventListener('storage', loadTx);
  }, []);

  return (
    <aside className="hidden xl:block w-80 p-6 h-screen sticky top-0 overflow-y-auto z-30 shrink-0">
      
      {/* Active Transaction Widget */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-900 mb-3 text-sm">Aktif İşlem</h3>
        {activeTx && activeTx.status !== TrackerStep.COMPLETED && activeTx.status !== TrackerStep.CANCELLED && activeTx.status !== TrackerStep.FAILED ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Sürüyor</span>
                 <span className="text-[10px] text-gray-400">{new Date(activeTx.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">
                 {activeTx.supporterId === 'current-user' ? `Destek: ${activeTx.seekerName}` : `Tutar: ${activeTx.amounts.supportAmount} ₺`}
              </p>
              
              <div className="my-3 opacity-80 scale-90 origin-left -ml-2">
                 <Tracker 
                    currentStep={activeTx.status}
                    steps={[
                        { id: TrackerStep.WAITING_SUPPORTER, label: 'Eşleşme' },
                        { id: TrackerStep.CASH_PAID, label: 'Ödeme' },
                        { id: TrackerStep.PAYMENT_CONFIRMED, label: 'Onay' }
                    ]}
                 />
              </div>

              <button 
                onClick={() => navigate(activeTx.supporterId === 'current-user' ? '/supporters' : '/find-share')}
                className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                Detaya Git <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Loader2 size={18} className="text-gray-300" />
             </div>
             <p className="text-xs text-gray-400 font-medium">Aktif işleminiz yok.</p>
          </div>
        )}
      </div>

      {/* Promo Widget */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20 mb-6 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/invite')}>
         <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
         <div className="relative z-10">
            <Gift size={24} className="mb-3" />
            <h4 className="font-bold text-lg leading-tight mb-1">Arkadaşını Davet Et</h4>
            <p className="text-xs text-purple-100 mb-3 opacity-90">%1 Komisyon kazan.</p>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Kodu Paylaş</span>
         </div>
      </div>

      {/* Safety Info */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
         <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
         <div>
            <h4 className="text-xs font-bold text-gray-800">Güvenli Ödeme</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
               Ödemeleriniz Workigom güvencesi altındadır. Sorun yaşarsanız 7/24 destek hattımıza ulaşabilirsiniz.
            </p>
         </div>
      </div>

    </aside>
  );
};
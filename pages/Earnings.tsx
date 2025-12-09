import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, ArrowUpRight, Wallet, History } from 'lucide-react';
import { Button } from '../components/Button';
import { ReferralService, RewardLog } from '../types';

export const Earnings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(ReferralService.getUserProfile());
  const [logs, setLogs] = useState<RewardLog[]>([]);

  useEffect(() => {
    setUser(ReferralService.getUserProfile());
    setLogs(ReferralService.getLogs());
  }, []);

  return (
    <div className="pb-24 min-h-screen bg-gray-50 font-sans">
      <div className="bg-slate-900 text-white pt-8 pb-28 px-6 rounded-b-[2.5rem] relative shadow-xl">
        <div className="flex items-center mb-4 relative z-10">
           <button onClick={() => navigate(-1)} className="flex items-center text-white/80 hover:text-white transition-colors absolute left-0">
             <ChevronLeft />
           </button>
           <h1 className="text-lg font-bold w-full text-center">Kazançlarım</h1>
        </div>
        
        <div className="text-center relative z-10 mt-0">
           <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">TOPLAM BAKİYE</p>
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-1">
             ₺{user.wallet.balance.toFixed(2)}
           </h2>
           <div className="flex items-center justify-center gap-2 mt-2">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-slate-200 flex items-center gap-1">
                 <TrendingUp size={12} className="text-green-400" /> Toplam: ₺{user.wallet.totalEarnings.toFixed(2)}
              </span>
           </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
         <div className="flex gap-4">
            <button className="flex-1 bg-slate-800 text-white p-4 rounded-2xl shadow-lg shadow-slate-900/30 flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors">
               <ArrowUpRight size={24} />
               <span className="text-xs font-bold">Para Çek</span>
            </button>
            <button 
               onClick={() => navigate('/invite')}
               className="flex-1 bg-white text-gray-800 p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
            >
               <Wallet size={24} className="text-slate-900" />
               <span className="text-xs font-bold">Daha Fazla Kazan</span>
            </button>
         </div>
      </div>

      <div className="px-6 mt-8">
         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            Ödül Geçmişi
         </h3>
         
         <div className="space-y-3">
            {logs.length === 0 ? (
               <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-gray-100">
                  <p>Henüz ödül kaydı yok.</p>
                  <Button variant="outline" className="mt-4 text-xs" onClick={() => navigate('/invite')}>
                     Arkadaşını Davet Et
                  </Button>
               </div>
            ) : (
               logs.map(log => (
                  <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                           <TrendingUp size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800">Referans Ödülü</p>
                           <p className="text-xs text-gray-500">Arkadaşın: {log.sourceUserName}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="block font-bold text-green-600">+₺{log.amount.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400">
                           {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};
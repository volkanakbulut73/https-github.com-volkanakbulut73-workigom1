
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Utensils, ArrowLeftRight, Bell, Gift, Wallet, ChevronRight, Star, Plus, Loader2, TrendingUp, ShieldCheck } from 'lucide-react';
import { ReferralService, User, DBService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(ReferralService.getUserProfile());
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRealData = async () => {
      if (!isSupabaseConfigured()) return;
      
      const currentUser = ReferralService.getUserProfile();
      if (!currentUser || currentUser.id === 'guest') return;

      setLoading(true);
      try {
        const profile = await DBService.getUserProfile(currentUser.id);
        if (profile) {
           setUser(profile);
           ReferralService.saveUserProfile(profile);
        }
      } catch (e) {
        console.warn("Background data fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Günaydın');
    else if (hour >= 12 && hour < 18) setGreeting('Tünaydın');
    else setGreeting('İyi Akşamlar');
  }, []);

  if (!user || user.id === 'guest') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
    );
  }

  const safeName = (user.name || 'Kullanıcı').split(' ')[0];
  const balance = user.wallet?.balance || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md">
         <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/profile')}>
            <div className="relative">
               <img src={user.avatar} alt={safeName} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xl group-hover:scale-105 transition-transform" />
               <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-lg border-2 border-white shadow-sm">
                  <ShieldCheck size={10} className="text-white" />
               </div>
            </div>
            <div>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{greeting},</p>
               <h1 className="text-slate-900 text-xl font-black tracking-tight leading-none mt-0.5">{safeName}</h1>
            </div>
         </div>

         <button className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 relative hover:bg-slate-50 transition-colors">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
         </button>
      </header>

      <div className="px-6 space-y-6 mt-6 animate-fade-in">
         
         {/* Wallet Card - FinTech Style */}
         <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none transition-all group-hover:bg-emerald-500/20"></div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <Wallet size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Cüzdan Bakiyesi</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/5">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-black">{user.rating || 5.0}</span>
                      </div>
                      <div className="bg-pink-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-pink-500/10">
                        <Heart size={12} className="text-pink-400 fill-pink-400" />
                        <span className="text-xs font-black">{user.goldenHearts || 0}</span>
                      </div>
                  </div>
               </div>
               
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Mevcut Tutar</p>
                    <h2 className="text-4xl font-black tracking-tighter">₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <button onClick={() => navigate('/earnings')} className="bg-white text-slate-900 p-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <TrendingUp size={22} />
                  </button>
               </div>
            </div>
         </div>

         {/* Quick Actions */}
         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/find-share')}
              className="bg-emerald-500 p-6 rounded-[2rem] text-slate-950 flex flex-col gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all group"
            >
               <div className="bg-black/5 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} />
               </div>
               <span className="font-black text-sm tracking-tight leading-tight">Paylaşım <br/>Talebi Oluştur</span>
            </button>
            <button 
              onClick={() => navigate('/swap')}
              className="bg-white p-6 rounded-[2rem] text-slate-900 flex flex-col gap-3 border border-gray-100 shadow-sm active:scale-95 transition-all group"
            >
               <div className="bg-slate-100 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowLeftRight size={20} />
               </div>
               <span className="font-black text-sm tracking-tight leading-tight">Takas <br/>Pazarına Göz At</span>
            </button>
         </div>

         {/* Premium Invite Banner */}
         <div 
            onClick={() => navigate('/invite')}
            className="relative rounded-[2.5rem] p-8 text-white shadow-2xl shadow-purple-900/20 overflow-hidden cursor-pointer group transition-all"
         >
             <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Friends" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
             </div>
             
             <div className="relative z-10 max-w-[65%]">
                <div className="inline-flex items-center gap-2 bg-emerald-500 px-3 py-1 rounded-full mb-4 shadow-lg shadow-emerald-500/20">
                    <Gift size={12} className="text-slate-900" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Sınırlı Teklif</span>
                </div>
                
                <h3 className="text-2xl font-black leading-[1.1] mb-3 tracking-tighter">
                   Arkadaşını Davet Et,<br/>
                   <span className="text-emerald-400">%1 Ödül Kazan!</span>
                </h3>
                
                <p className="text-slate-300 text-xs font-medium leading-relaxed opacity-90">
                   Referansınla gelenlerin her işleminden 1 yıl boyunca nakit kazan.
                </p>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black bg-white text-slate-950 px-5 py-3 rounded-xl inline-flex shadow-xl active:inset-px transition-all uppercase tracking-widest">
                   Linkini Paylaş <ChevronRight size={14} />
                </div>
             </div>
         </div>

      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Utensils, ArrowLeftRight, Bell, Gift, Wallet, ChevronRight, Star, Plus } from 'lucide-react';
import { TransactionService, ReferralService, User, DBService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(ReferralService.getUserProfile());
  const [greeting, setGreeting] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    const fetchRealData = async () => {
      if (!isSupabaseConfigured()) return;

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
           const profile = await DBService.getUserProfile(authUser.id);
           if (profile) {
              setUser(profile);
              ReferralService.saveUserProfile(profile);
           }
           const counts = await DBService.getUnreadCounts(authUser.id);
           setUnreadCounts(counts);
        }
      } catch (e) {
        console.log("Offline or demo mode", e);
      }
    };
    fetchRealData();

    const loadData = () => {
      setUser(ReferralService.getUserProfile());
    };
    loadData();
    window.addEventListener('storage', loadData);
    
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Günaydın');
    else if (hour >= 12 && hour < 18) setGreeting('Tünaydın');
    else setGreeting('İyi Geceler');

    return () => window.removeEventListener('storage', loadData);
  }, []);

  const safeName = typeof user.name === 'string' ? user.name.split(' ')[0] : 'Misafir';
  const safeAvatar = typeof user.avatar === 'string' ? user.avatar : 'https://picsum.photos/100/100';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-indigo-100">
      
      {/* Header */}
      <header className="px-6 pt-8 pb-2 flex justify-between items-center sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur-md">
         <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/profile')}>
            <div className="relative">
               <img src={safeAvatar} alt={safeName} className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition-transform" />
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{greeting}</p>
               <h1 className="text-slate-800 text-lg font-black tracking-tight leading-none">{safeName}</h1>
            </div>
         </div>

         <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 relative hover:bg-slate-50 transition-colors">
            <Bell size={18} className="text-slate-600" />
            {unreadCounts.notifications > 0 && (
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
         </button>
      </header>

      <div className="px-6 space-y-6 mt-4 animate-fade-in">
         
         {/* Wallet Card - Compact & Clean */}
         <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-center">
               <div>
                  <div className="flex items-center gap-2 mb-1 opacity-80">
                      <Wallet size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">Cüzdanım</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">₺{user.wallet.balance.toFixed(2)}</h2>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{user.rating}</span>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                      <Heart size={12} className="text-pink-400 fill-pink-400" />
                      <span className="text-xs font-bold">{user.goldenHearts}</span>
                   </div>
               </div>
            </div>
         </div>

         {/* Invite Banner - FOCUS AREA - WITH BACKGROUND IMAGE */}
         <div 
            onClick={() => navigate('/invite')}
            className="relative rounded-[2.5rem] p-8 text-white shadow-lg shadow-purple-500/30 overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] active:scale-[0.98]"
         >
             {/* Background Image Layer */}
             <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Friends" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-purple-900/80 to-purple-500/40 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
             </div>
             
             <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-3 border border-white/20 shadow-sm">
                    <Gift size={12} className="text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Özel Fırsat</span>
                </div>
                
                <h3 className="text-2xl font-black leading-tight mb-2 drop-shadow-sm">
                   Arkadaşını Getir,<br/>
                   <span className="text-yellow-300">%1 Nakit ödül  Kazan!</span>
                </h3>
                
                <p className="text-white/90 text-sm font-medium max-w-[80%] leading-relaxed drop-shadow-sm">
                   Arkadaşının yaptığı her işlemden bir yıl boyunca % 1 ödül kazan.
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold bg-white text-purple-700 px-5 py-3 rounded-xl inline-flex shadow-lg shadow-black/10 hover:bg-gray-50 transition-colors">
                   Hemen Davet Et <ChevronRight size={16} />
                </div>
             </div>
             
             {/* Decorative Element */}
             <div className="absolute -bottom-6 -right-6 text-white/10 rotate-12 transform group-hover:rotate-0 transition-transform duration-500 z-0">
                <Gift size={140} />
             </div>
         </div>

      </div>
    </div>
  );
};

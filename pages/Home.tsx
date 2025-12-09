import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Sparkles, Utensils, ShoppingBag, User as UserIcon, MessageCircle, Bell, Gift, Wallet } from 'lucide-react';
import { TransactionService, ReferralService, User, DBService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ supportGiven: 8 });
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
      const history = TransactionService.getHistory();
      const given = history.filter(t => t.supporterId === 'CURRENT_USER').length;
      setStats({
        supportGiven: 8 + given,
      });
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

  const safeName = typeof user.name === 'string' ? user.name : 'Kullanıcı';
  const safeAvatar = typeof user.avatar === 'string' ? user.avatar : 'https://picsum.photos/100/100';

  return (
    <div className="pb-24 md:pb-0 min-h-screen bg-gray-50 font-sans relative">
      
      {/* Mobile Header (Curved) / Desktop Header (Card) */}
      <div className="md:rounded-3xl md:bg-slate-900 md:mb-6 md:p-8 bg-slate-900 text-white pt-10 pb-12 px-5 rounded-b-[1.5rem] shadow-sm relative overflow-hidden transition-all">
         <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

         <div className="relative z-10 flex justify-between items-start">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="relative">
                   <img src={safeAvatar} alt={safeName} className="w-9 h-9 md:w-12 md:h-12 rounded-full object-cover border border-white/20" />
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                </div>
                <div>
                   <p className="text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-wider leading-none mb-0.5">{greeting}</p>
                   <h1 className="font-bold text-sm md:text-xl leading-none">{safeName}</h1>
                   <div className="bg-white/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 mt-2 backdrop-blur-sm border border-white/5">
                      <Heart size={10} className="text-emerald-400 fill-emerald-400" />
                      <span className="text-[9px] md:text-[10px] font-bold text-emerald-100">Sosyal Dayanışma Platformu</span>
                   </div>
                </div>
             </div>

             <div className="flex gap-2">
                 <button 
                    onClick={() => navigate('/messages')} 
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm relative"
                 >
                    <MessageCircle size={16} className="text-white md:w-5 md:h-5" />
                    {unreadCounts.messages > 0 && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-slate-900"></span>
                    )}
                 </button>
                 <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm">
                    <Bell size={16} className="text-white md:w-5 md:h-5" />
                 </button>
             </div>
         </div>
         
         <div className="hidden md:flex mt-6 gap-4">
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 flex items-center gap-3 border border-white/10">
                 <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                    <Wallet size={24} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Cüzdan</p>
                    <p className="text-xl font-bold">₺{user.wallet.balance.toFixed(2)}</p>
                 </div>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1 flex items-center gap-3 border border-white/10">
                 <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                    <Sparkles size={24} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Puan</p>
                    <p className="text-xl font-bold">{user.rating}</p>
                 </div>
             </div>
         </div>
      </div>

      <div className="px-4 -mt-8 md:mt-0 relative z-20 space-y-4 md:space-y-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
           {/* Mobile Stats (Hidden on desktop if moved to header) but kept for specific layout requests */}
           <div className="md:hidden bg-white rounded-xl p-3 shadow-sm border border-gray-100 relative overflow-hidden h-20 flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-12 h-12 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full -mr-2 -mt-2"></div>
              <div className="flex justify-between items-center z-10">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Destekler</span>
                  <Heart size={12} className="text-emerald-500 fill-emerald-500/10" />
              </div>
              <div className="z-10">
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{stats.supportGiven}</h3>
                <span className="text-[8px] font-medium text-emerald-600">Harikasın!</span>
              </div>
           </div>

           <div className="md:hidden bg-white rounded-xl p-3 shadow-sm border border-gray-100 relative overflow-hidden h-20 flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-12 h-12 bg-gradient-to-br from-yellow-50 to-transparent rounded-bl-full -mr-2 -mt-2"></div>
              <div className="flex justify-between items-center z-10">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Puan</span>
                  <Sparkles size={12} className="text-yellow-400 fill-yellow-400" />
              </div>
              <div className="z-10 w-full">
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{user.goldenHearts}</h3>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                   <div className="h-full bg-yellow-400 w-2/3 rounded-full"></div>
                </div>
              </div>
           </div>
           
           {/* Desktop Quick Actions */}
           <div className="hidden md:flex bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-col justify-center items-center gap-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/find-share')}>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Utensils size={20} />
              </div>
              <span className="font-bold text-sm text-gray-700">Yemek Ye</span>
           </div>

           <div className="hidden md:flex bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-col justify-center items-center gap-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/swap')}>
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <ShoppingBag size={20} />
              </div>
              <span className="font-bold text-sm text-gray-700">Takas Yap</span>
           </div>
           
           <div className="hidden md:flex col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 shadow-lg text-white flex-row justify-between items-center cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => navigate('/invite')}>
               <div>
                  <h3 className="font-bold text-lg">Arkadaşını Davet Et</h3>
                  <p className="text-purple-100 text-sm opacity-90">Her davetle %1 kazan!</p>
               </div>
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Gift size={24} />
               </div>
           </div>

        </div>

        {/* Opportunities / Categories */}
        <div className="space-y-3">
           <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-slate-800 text-sm md:text-base">Sana Özel Fırsatlar</h2>
              <ChevronRight size={16} className="text-slate-400" />
           </div>
           
           <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar snap-x snap-mandatory">
              <OpportunityCard 
                icon={<Utensils size={18} className="text-white"/>} 
                title="Restoran" 
                subtitle="%20 İndirim" 
                color="from-violet-600 to-indigo-600"
                onClick={() => navigate('/find-share')}
              />
              <OpportunityCard 
                icon={<ShoppingBag size={18} className="text-white"/>} 
                title="Market" 
                subtitle="%15 İndirim" 
                color="from-emerald-500 to-teal-600"
                onClick={() => navigate('/find-share')}
              />
              <OpportunityCard 
                icon={<UserIcon size={18} className="text-gray-500"/>} 
                title="Profil" 
                subtitle="Tamamla" 
                color="bg-white border border-gray-100"
                textColor="text-gray-800"
                onClick={() => navigate('/profile')}
              />
               <OpportunityCard 
                icon={<Gift size={18} className="text-white"/>} 
                title="Davet Et" 
                subtitle="Kazan" 
                color="from-pink-500 to-rose-500"
                onClick={() => navigate('/invite')}
              />
           </div>
        </div>

        {/* Mobile Invite Banner */}
        <div 
           onClick={() => navigate('/invite')}
           className="md:hidden bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform h-16 hover:shadow-md"
        >
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 shrink-0 relative overflow-hidden bg-purple-50 rounded-lg flex items-center justify-center">
                <Gift size={20} className="text-purple-500" />
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-800">Arkadaşını Davet Et</h3>
                <p className="text-slate-400 text-[9px] mt-0.5">Her davetle %1 kazan!</p>
             </div>
           </div>
           
           <div className="bg-slate-50 p-1.5 rounded-lg">
              <ChevronRight size={14} className="text-slate-400" />
           </div>
        </div>
      </div>
    </div>
  );
};

interface OpportunityCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    textColor?: string;
    onClick: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ icon, title, subtitle, color, textColor = 'text-white', onClick }) => {
    const safeColor = typeof color === 'string' ? color : 'bg-gray-100';
    const bgClass = safeColor.includes('bg-') ? safeColor : `bg-gradient-to-b ${safeColor}`;

    return (
        <div 
            onClick={onClick}
            className={`min-w-[140px] w-[140px] md:w-full snap-center rounded-2xl p-4 shadow-sm relative overflow-hidden group active:scale-95 hover:scale-[1.02] transition-transform cursor-pointer flex flex-col justify-between h-28 md:h-32 ${bgClass}`}
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-lg -mr-4 -mt-4"></div>
            <div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${textColor === 'text-white' ? 'bg-white/20' : 'bg-gray-100'}`}>
                {icon}
            </div>
            <h3 className={`${textColor} font-bold text-sm leading-tight`}>{title}</h3>
            <p className={`${textColor} text-xs opacity-80 mt-0.5`}>{subtitle}</p>
            </div>
            <div className={`w-full h-1 rounded-full mt-2 ${textColor === 'text-white' ? 'bg-white/30' : 'bg-gray-100'}`}></div>
        </div>
    );
};
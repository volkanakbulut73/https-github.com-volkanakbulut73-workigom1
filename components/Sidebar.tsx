import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Heart, ArrowLeftRight, User, MessageCircle, LogOut, Plus, Wallet } from 'lucide-react';
import { ReferralService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = ReferralService.getUserProfile();

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
        ${isActive 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-slate-900'}`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 z-40 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/app')}>
          <div className="bg-emerald-500 p-2 rounded-lg text-white">
            <Wallet size={24} />
          </div>
          <span className="font-bold text-xl text-slate-900">Workigom</span>
        </div>

        <nav className="space-y-2">
          <NavItem to="/app" icon={Home} label="Ana Sayfa" />
          <NavItem to="/supporters" icon={Heart} label="Destek Talepleri" />
          <NavItem to="/swap" icon={ArrowLeftRight} label="Takas Pazarı" />
          <NavItem to="/messages" icon={MessageCircle} label="Mesajlar" />
          <NavItem to="/profile" icon={User} label="Profil" />
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-50">
        <button 
          onClick={() => navigate('/find-share')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all mb-4"
        >
          <Plus size={18} />
          <span>İlan Ekle</span>
        </button>

        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
           <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
           <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">Bakiye: ₺{user.wallet.balance}</p>
           </div>
           <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
           </button>
        </div>
      </div>
    </aside>
  );
};
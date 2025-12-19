
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogIn, UserPlus } from 'lucide-react';
import { ReferralService } from '../types';

export const WebNavbar: React.FC<{ isLanding?: boolean }> = ({ isLanding = false }) => {
  const navigate = useNavigate();
  const user = ReferralService.getUserProfile();
  // Safe check for login status
  const isLoggedIn = user?.id && user.id !== 'guest' && user.id !== 'current-user';

  return (
    <nav className={`w-full z-50 transition-all ${isLanding ? 'absolute top-0 left-0 bg-transparent py-6' : 'bg-white border-b border-gray-100 sticky top-0 py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <span className={`font-bold text-2xl tracking-tight ${isLanding ? 'text-white' : 'text-slate-900'}`}>
            Workig<span className="text-emerald-500">om</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {isLanding && (
            <div className={`flex gap-6 text-sm font-medium ${isLanding ? 'text-white/80' : 'text-gray-600'}`}>
              <a href="#nasil-calisir" className="hover:text-emerald-400 transition-colors">Nasıl Çalışır?</a>
              <a href="#avantajlar" className="hover:text-emerald-400 transition-colors">Avantajlar</a>
              <a href="#sss" className="hover:text-emerald-400 transition-colors">S.S.S</a>
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <>
                <Link 
                  to="/login" 
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                    isLanding 
                      ? 'text-white hover:bg-white/10' 
                      : 'text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <LogIn size={16} /> Giriş Yap
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-slate-900 hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <UserPlus size={16} /> Kayıt Ol
                </Link>
              </>
            )}
            {isLoggedIn && (
               <Link 
                to="/app" 
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                  isLanding 
                    ? 'bg-white text-slate-900' 
                    : 'bg-slate-900 text-white'
                }`}
              >
                Uygulamaya Git
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

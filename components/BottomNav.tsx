
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Heart, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Hide on Landing Page ('/'), Login, Register, or detail pages where necessary
  const shouldHide = 
    currentPath === '/' ||
    currentPath === '/login' || 
    currentPath === '/register' || 
    currentPath === '/swap/create';

  if (shouldHide) {
    return null;
  }

  const isActive = (path: string) => currentPath.startsWith(path);
  
  const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link to={to} className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full ${active ? 'text-slate-900' : 'text-gray-400 hover:text-gray-500'}`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[9px] font-bold ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </Link>
  );

  return (
    // Added md:hidden to hide on desktop
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe z-50 h-[60px] flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)] md:hidden">
      <NavItem to="/app" icon={Home} label="Ana Sayfa" active={isActive('/app')} />
      <NavItem to="/supporters" icon={Heart} label="Talepler" active={isActive('/supporters')} />

      <div className="relative -top-6 mx-1">
        <Link to="/find-share">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/30 transform transition-transform hover:scale-105 active:scale-95 border-2 border-white">
            <Plus size={24} className="text-white" />
          </div>
        </Link>
      </div>

      <NavItem to="/swap" icon={Heart} label="Takas" active={isActive('/swap')} />
      <NavItem to="/profile" icon={User} label="Profil" active={isActive('/profile')} />
    </nav>
  );
};

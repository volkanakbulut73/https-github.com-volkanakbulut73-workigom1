
import React from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  user?: {
    name: string;
    avatar: string;
  };
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showProfile = false, user, transparent = false }) => {
  return (
    <header className={`sticky top-0 z-40 px-6 py-4 flex items-center justify-between ${transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md shadow-sm'}`}>
      {showProfile && user ? (
        <div className="flex items-center gap-3">
          <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
          <div>
            <p className="text-xs text-gray-500">Merhaba,</p>
            <h1 className="font-bold text-gray-800 leading-none">{user.name} 👋</h1>
          </div>
        </div>
      ) : (
        <h1 className={`text-xl font-bold ${transparent ? 'text-white' : 'text-gray-800'}`}>{title}</h1>
      )}

      <div className="flex gap-3">
        <button className={`p-2 rounded-full relative ${transparent ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`}>
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { Wallet, Instagram, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <Wallet size={20} />
              </div>
              <span className="font-bold text-xl">Workigom</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yemek kartı bakiyelerinizi paylaşmanın veya indirimli yemek yemenin en güvenli yolu.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Platform</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Nasıl Çalışır?</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Güvenlik</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Topluluk Kuralları</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Kurumsal</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">İletişim</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Gizlilik Politikası</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Sosyal Medya</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Workigom Teknoloji A.Ş. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
};
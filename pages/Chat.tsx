
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ReferralService } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const sdkInitialized = useRef(false);
  const user = ReferralService.getUserProfile();

  useEffect(() => {
    // Birden fazla başlatmayı engellemek için
    if (sdkInitialized.current) return;

    const loadAndInitSDK = async () => {
      try {
        // SDK modülünü talimatlarda belirtilen proxy yolundan çekiyoruz
        // Not: Tarayıcıda 'Failed to fetch' hatasını önlemek için tam yol /chat-sdk/assets/index.js kullanıldı
        const module = await import('/chat-sdk/assets/index.js');
        
        // Modül içinden veya global window üzerinden fonksiyona erişim kontrolü
        const initFn = module.initWorkigomChat || (window as any).initWorkigomChat;

        if (typeof initFn === 'function') {
          initFn('workigom-chat-target', {
            externalUser: user?.name || 'Misafir',
            className: 'workigom-chat-wrapper'
          });
          sdkInitialized.current = true;
        } else {
          console.error("Workigom Chat SDK: initWorkigomChat fonksiyonu bulunamadı.");
        }
      } catch (error) {
        console.error("Workigom Chat SDK yükleme hatası:", error);
      }
    };

    loadAndInitSDK();
  }, [user?.name]);

  return (
    <div className="pb-20 min-h-screen bg-black font-sans flex flex-col h-[100dvh] overflow-hidden">
      {/* Header: mIRC/Retro estetiği ile harmanlanmış modern yapı */}
      <div className="bg-slate-900 text-white pt-10 pb-4 px-5 flex-shrink-0 md:rounded-b-3xl shadow-sm z-20 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors md:hidden"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-wide text-emerald-400">Workigom Global Chat</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">v1.0.8 Secure Node</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat SDK Container */}
      <div className="flex-1 relative z-10 w-full h-full bg-[#000] md:mt-4 md:rounded-3xl md:shadow-2xl md:border md:border-emerald-500/10 md:overflow-hidden md:max-w-6xl md:mx-auto">
          {/* SDK'nın yükleneceği hedef element (Target ID: workigom-chat-target) */}
          <div 
            id="workigom-chat-target" 
            className="w-full h-full min-h-[400px]"
            style={{ 
              backgroundColor: '#000',
              color: '#00ff00',
              fontFamily: 'monospace'
            }}
          >
            {/* SDK Yüklenirken gösterilecek fallback alanı */}
            <div className="flex flex-col items-center justify-center h-full gap-4 text-emerald-500/50">
              <Loader2 className="animate-spin" size={32} />
              <div className="text-center space-y-2">
                <p className="text-[10px] font-mono animate-pulse tracking-widest uppercase italic">ESTABLISHING ENCRYPTED LINK...</p>
                <p className="text-[8px] text-gray-600 font-mono">Bypassing CORS via Local Proxy...</p>
              </div>
            </div>
          </div>
      </div>

      {/* Global CSS Overrides for Responsive and Retro Aesthetics */}
      <style>{`
        #workigom-chat-target {
          height: 100% !important;
          width: 100% !important;
        }
        
        .workigom-chat-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: none;
        }

        /* Mobil Görünüm Optimizasyonu: SDK penceresini Header ve BottomNav arasına sabitler */
        @media (max-width: 768px) {
          #workigom-chat-target {
            position: fixed;
            top: 72px; /* Header yüksekliği + padding */
            bottom: 60px; /* BottomNav yüksekliği */
            left: 0;
            right: 0;
            z-index: 15;
            height: calc(100dvh - 132px) !important;
          }
        }

        /* mIRC Esintili Parıltı Efekti (Opsiyonel) */
        #workigom-chat-target::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
          z-index: 5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

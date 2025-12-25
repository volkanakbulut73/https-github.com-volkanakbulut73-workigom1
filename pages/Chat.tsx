
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ReferralService } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const sdkInitialized = useRef(false);

  useEffect(() => {
    if (sdkInitialized.current) return;

    const initSDK = async () => {
      try {
        // SDK Modülünü dinamik olarak içe aktar
        const { initWorkigomChat } = await import('https://www.workigomchat.online/index.js');
        
        const user = ReferralService.getUserProfile();
        
        // SDK Başlatma
        initWorkigomChat('workigom-chat-container', {
          externalUser: user?.name || 'Misafir',
          className: 'workigom-chat-wrapper'
        });
        
        sdkInitialized.current = true;
      } catch (error) {
        console.error("Workigom Chat SDK yüklenemedi:", error);
      }
    };

    initSDK();
  }, []);

  return (
    <div className="pb-20 min-h-screen bg-black font-sans flex flex-col h-[100dvh] overflow-hidden">
       {/* Header - mIRC stili için koyu tema korunuyor */}
       <div className="bg-slate-900 text-white pt-10 pb-4 px-5 flex-shrink-0 md:rounded-b-3xl shadow-sm z-20 border-b border-emerald-500/20">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors md:hidden">
                <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base font-bold tracking-wide text-emerald-400">Workigom Global Chat</h1>
              <span className="text-[10px] text-gray-500 font-mono uppercase">v1.0.8 Connected</span>
            </div>
         </div>
      </div>
      
      {/* Chat SDK Container */}
      <div className="flex-1 relative z-10 w-full h-full bg-[#000] md:mt-4 md:rounded-3xl md:shadow-2xl md:border md:border-emerald-500/10 md:overflow-hidden md:max-w-6xl md:mx-auto">
          {/* SDK'nın yükleneceği hedef element */}
          <div 
            id="workigom-chat-container" 
            className="w-full h-full min-h-[400px]"
            style={{ 
              backgroundColor: '#000',
              color: '#00ff00', // mIRC klasik yeşil yazı tipi için temel
              fontFamily: 'monospace'
            }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-4 text-emerald-500/50">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-xs font-mono animate-pulse tracking-widest">CONNECTING TO WORKIGOM SERVER...</p>
            </div>
          </div>
      </div>

      {/* Mobil Responsive ve mIRC Estetiği için ek CSS */}
      <style>{`
        #workigom-chat-container {
          height: 100% !important;
          width: 100% !important;
        }
        
        .workigom-chat-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* mIRC Retro Görünümü İçin SDK'nın sınıflarına müdahale gerekirse */
        @media (max-width: 768px) {
          #workigom-chat-container {
            position: fixed;
            top: 56px; /* Header yüksekliği */
            bottom: 60px; /* BottomNav yüksekliği */
            left: 0;
            right: 0;
            z-index: 15;
          }
        }
      `}</style>
    </div>
  );
};

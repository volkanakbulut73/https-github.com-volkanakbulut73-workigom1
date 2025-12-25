
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Terminal, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { ReferralService } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const sdkInitialized = useRef(false);
  const user = ReferralService.getUserProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sdkInitialized.current) return;

    const initSDK = () => {
      // Script tag ile yüklenen global fonksiyonu kontrol et
      const initFn = (window as any).initWorkigomChat;

      if (typeof initFn === 'function') {
        try {
          initFn('workigom-chat-target', {
            externalUser: user?.name || 'User_' + Math.floor(Math.random() * 9999),
            className: 'workigom-sdk-wrapper'
          });
          sdkInitialized.current = true;
          setLoading(false);
          setError(null);
          return true;
        } catch (err) {
          console.error("SDK Init Execution Error:", err);
          setError("Sohbet modülü çalıştırılamadı.");
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    // Polling: Script'in yüklenip global nesneye eklenmesini bekle
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const success = initSDK();
      if (success || attempts > 60) { // 6 saniye bekleme süresi
        clearInterval(interval);
        if (!success && !sdkInitialized.current) {
          setError("Workigom Chat sunucusuna bağlanılamadı. Lütfen internet bağlantınızı ve domain ayarlarını kontrol edin.");
          setLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-black flex flex-col h-[100dvh] overflow-hidden">
      {/* Terminal Style Header */}
      <div className="bg-[#000080] text-white px-4 py-3 flex items-center justify-between border-b border-gray-700 select-none shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app')} 
            className="hover:bg-white/20 p-1.5 rounded transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={18} />
            <span className="text-[10px] font-mono hidden sm:inline">BACK_TO_APP</span>
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              <h1 className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-100">
                Workigom.Chat Node
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              USR: {user?.name?.toUpperCase() || 'GUEST'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-white/50 font-mono">
                <Shield size={12} className="text-blue-400" />
                <span>CROSSORIGIN_AUTH_OK</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-[#ff5555] rounded-sm"></div>
            </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black flex flex-col">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/95">
            <Loader2 className="animate-spin text-emerald-500 mb-6" size={48} strokeWidth={1.5} />
            <div className="space-y-2 text-center">
                <p className="text-emerald-500 font-mono text-xs animate-pulse tracking-[0.4em] uppercase">
                  Connecting to Root...
                </p>
                <p className="text-gray-600 font-mono text-[9px] uppercase tracking-widest">
                  Auth: workigomchat.online/index.js
                </p>
            </div>
          </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black p-8">
                <div className="p-6 bg-red-900/10 border border-red-500/30 rounded-3xl max-w-sm text-center">
                    <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 font-mono text-xs mb-6 uppercase tracking-tight">
                        {error}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] font-bold px-6 py-3 rounded-xl uppercase transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} /> Retry Handshake
                    </button>
                </div>
            </div>
        )}
        
        <div 
          id="workigom-chat-target" 
          className="w-full h-full flex-1"
        ></div>
      </div>

      <style>{`
        #workigom-chat-target {
          background: #000;
          height: 100% !important;
          width: 100% !important;
          overflow: hidden;
        }

        .workigom-sdk-wrapper {
          height: 100% !important;
          width: 100% !important;
        }

        @media (max-width: 768px) {
          #workigom-chat-target {
            position: fixed;
            top: 52px;
            bottom: 0px;
            left: 0;
            right: 0;
            z-index: 10;
            height: calc(100dvh - 52px) !important;
          }
        }
      `}</style>
    </div>
  );
};

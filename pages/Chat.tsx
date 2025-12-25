
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Terminal, Shield, AlertCircle, RefreshCw, Radio } from 'lucide-react';
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
      // SDK tarafından pencereye (window) eklenen global init fonksiyonu
      const initFn = (window as any).initWorkigomChat;

      if (typeof initFn === 'function') {
        try {
          // SDK v1.1.1 Parametreleri
          initFn('workigom-chat-container', {
            externalUser: user?.name || 'User_' + Math.floor(Math.random() * 9999),
            embedded: true, // Tanıtım sayfasını atla, doğrudan girişe git
            className: 'workigom-sdk-wrapper'
          });
          sdkInitialized.current = true;
          setLoading(false);
          setError(null);
          return true;
        } catch (err) {
          console.error("SDK Initialization Error:", err);
          setError("Sohbet modülü başlatılırken bir sistem hatası oluştu.");
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    // Polling: Script yüklenene kadar kontrol et (Max 8 saniye)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const success = initSDK();
      if (success || attempts > 80) { 
        clearInterval(interval);
        if (!success && !sdkInitialized.current) {
          setError("Workigom Chat sunucusuyla el sıkışılamadı (Handshake Timeout). Lütfen sayfayı yenileyin.");
          setLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-black flex flex-col h-[100dvh] overflow-hidden font-mono">
      {/* OS Style Header (mIRC / Win95 Retro Aesthetic) */}
      <div className="bg-[#000080] text-white px-4 py-2.5 flex items-center justify-between border-b border-gray-700 select-none shadow-xl shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app')} 
            className="hover:bg-white/20 p-1 rounded transition-colors flex items-center gap-1.5 border border-white/10 active:inset-px shadow-inner"
          >
            <ChevronLeft size={16} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">APP_ROOT</span>
          </button>
          
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <Terminal size={12} className="text-emerald-400" />
              <h1 className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                Workigom.Chat Node [v1.1.1]
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
              <span className="text-[8px] text-gray-400 uppercase font-black">
                ID: {user?.name?.toUpperCase() || 'ANONYMOUS_GUEST'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
            <div className="hidden sm:flex items-center gap-2 text-[9px] text-white/40">
                <Shield size={10} className="text-blue-400" />
                <span className="tracking-widest">ENCRYPTED_TUNNEL</span>
            </div>
            <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-600 rounded-sm border border-white/10"></div>
                <div className="w-4 h-4 bg-[#ff5555] rounded-sm border border-white/20 shadow-inner"></div>
            </div>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className="bg-[#1a1a1a] border-b border-white/5 px-4 py-1 flex items-center gap-4 shrink-0 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-500 whitespace-nowrap">
          <Radio size={10} className={loading ? 'animate-bounce text-emerald-500' : 'text-gray-600'} />
          STATUS: <span className={loading ? 'text-amber-500' : 'text-emerald-500'}>{loading ? 'ESTABLISHING_AUTH...' : 'CONNECTED'}</span>
        </div>
        <div className="flex-1 h-[1px] bg-white/5"></div>
        <div className="text-[8px] text-gray-600 uppercase tracking-widest">
          Node: workigomchat.online
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-black flex flex-col">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black">
            <div className="relative mb-8">
                <Loader2 className="animate-spin text-emerald-500" size={56} strokeWidth={1} />
                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full"></div>
            </div>
            <div className="space-y-3 text-center">
                <p className="text-emerald-500 text-[10px] animate-pulse tracking-[0.5em] uppercase font-black">
                  Bypassing Redirects...
                </p>
                <p className="text-gray-700 text-[8px] uppercase tracking-[0.3em]">
                  Initializing Embedded Mode v1.1.1
                </p>
            </div>
          </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black p-8">
                <div className="p-8 bg-red-900/5 border border-red-500/20 rounded-[2rem] max-w-sm text-center shadow-2xl shadow-red-500/5">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-6 opacity-80" />
                    <p className="text-red-400 text-[11px] mb-8 uppercase tracking-wide leading-relaxed font-bold">
                        {error}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-black hover:bg-red-500 hover:text-white font-black text-[10px] px-8 py-4 rounded-xl uppercase transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        <RefreshCw size={14} /> Re-Init System
                    </button>
                </div>
            </div>
        )}
        
        {/* SDK v1.1.1 Target Container */}
        <div 
          id="workigom-chat-container" 
          className="w-full h-full flex-1 relative z-10"
        ></div>

        {/* CRT Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        </div>
      </div>

      <style>{`
        #workigom-chat-container {
          background: #000;
          height: 100% !important;
          width: 100% !important;
          overflow: hidden;
        }

        /* SDK v1.1.1 wrapper styles */
        .workigom-sdk-wrapper {
          height: 100% !important;
          width: 100% !important;
          border: none !important;
        }

        /* Fix for mobile keyboard and view height */
        @media (max-width: 768px) {
          #workigom-chat-container {
            position: fixed;
            top: 72px; /* Header + Status Bar */
            bottom: 0px;
            left: 0;
            right: 0;
            z-index: 10;
            height: calc(100dvh - 72px) !important;
          }
        }
      `}</style>
    </div>
  );
};

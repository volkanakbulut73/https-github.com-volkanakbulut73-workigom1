import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldCheck, Terminal, AlertCircle, RefreshCw } from 'lucide-react';
import { ReferralService } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const sdkInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = ReferralService.getUserProfile();

  useEffect(() => {
    if (sdkInitialized.current) return;

    const initSDK = () => {
      // Access the global function provided by the SDK v1.1.1
      const initFn = (window as any).initWorkigomChat;
      
      if (typeof initFn === 'function') {
        try {
          initFn('workigom-chat-container', {
            embedded: true, // v1.1.1: Skips landing page, opens chat directly
            externalUser: user?.name || 'Kullanıcı',
            className: 'workigom-v1-1-1-embedded'
          });
          sdkInitialized.current = true;
          setIsLoading(false);
          setError(null);
          return true;
        } catch (err) {
          console.error("SDK Init Error:", err);
          setError("Chat modülü başlatılamadı. Lütfen sayfayı yenileyin.");
          setIsLoading(false);
          return true;
        }
      }
      return false;
    };

    // Polling to wait for the script to load and populate window.initWorkigomChat
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const success = initSDK();
      if (success || attempts > 50) { // 5 seconds timeout
        clearInterval(interval);
        if (!success && !sdkInitialized.current) {
          setError("Bağlantı zaman aşımına uğradı. SDK yüklenemedi.");
          setIsLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-black flex flex-col h-[100dvh] overflow-hidden">
       {/* App Bar / Header */}
       <header className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-white/5 z-20 shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app')} 
              className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
            >
                <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tight flex items-center gap-2">
                <Terminal size={14} className="text-emerald-500" />
                Global Sohbet <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-tighter">v1.1.1</span>
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
                Hattasız Bağlantı: {user?.name || 'Anonim'}
              </div>
            </div>
         </div>
         
         <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-blue-400" />
            End-to-End Encrypted
         </div>
      </header>
      
      {/* Chat Container */}
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/95">
              <div className="relative mb-6">
                <Loader2 className="animate-spin text-emerald-500" size={48} strokeWidth={1.5} />
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full"></div>
              </div>
              <p className="text-emerald-500 font-mono text-[10px] animate-pulse tracking-[0.4em] uppercase font-black">
                Initializing Secure Tunnel...
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-950 p-8 text-center">
              <div className="max-w-xs space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Bağlantı Hatası</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-white text-black font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors uppercase tracking-widest"
                >
                  <RefreshCw size={16} /> Yeniden Dene
                </button>
              </div>
            </div>
          )}
          
          {/* SDK Integration Point */}
          <div 
            id="workigom-chat-container" 
            className="w-full h-full flex-1"
            style={{ minHeight: '400px' }}
          ></div>
      </div>

      <style>{`
        #workigom-chat-container {
          height: 100% !important;
          width: 100% !important;
        }
        
        .workigom-v1-1-1-embedded {
          height: 100% !important;
          width: 100% !important;
          border: none !important;
        }

        /* Responsive Fixes for SDK components */
        @media (max-width: 768px) {
          #workigom-chat-container {
            position: fixed;
            top: 64px;
            bottom: 0px;
            left: 0;
            right: 0;
            z-index: 10;
            height: calc(100dvh - 64px) !important;
          }
        }
      `}</style>
    </div>
  );
};
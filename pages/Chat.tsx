
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Terminal } from 'lucide-react';
import { ReferralService } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const sdkInitialized = useRef(false);
  const user = ReferralService.getUserProfile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sdkInitialized.current) return;

    const initSDK = async () => {
      try {
        // Dynamically import the SDK through our proxy to avoid CORS
        // We try common entry points mentioned in the prompt
        const module = await import('/chat-sdk/index.js').catch(() => import('/chat-sdk/assets/index.js'));
        
        const initFn = module.initWorkigomChat || (window as any).initWorkigomChat;

        if (typeof initFn === 'function') {
          initFn('workigom-chat-container', {
            externalUser: user?.name || 'Guest_' + Math.floor(Math.random() * 1000),
            className: 'custom-chat-wrapper'
          });
          sdkInitialized.current = true;
          setLoading(false);
        } else {
          console.error("Workigom Chat SDK: initWorkigomChat function not found.");
        }
      } catch (error) {
        console.error("Workigom Chat SDK failed to load:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initSDK, 500);
    return () => clearTimeout(timer);
  }, [user?.name]);

  return (
    <div className="min-h-screen bg-[#000] flex flex-col h-[100dvh] overflow-hidden">
      {/* mIRC Style Header */}
      <div className="bg-[#000080] text-white px-4 py-2 flex items-center justify-between border-b border-gray-600 select-none">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-tight">
              Status: [Workigom Chat v1.0.8] - {user?.name || 'Guest'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
            <p className="text-emerald-500 font-mono text-sm animate-pulse tracking-[0.2em]">
              CONNECTING TO IRC SERVER...
            </p>
          </div>
        )}
        
        {/* SDK Container */}
        <div 
          id="workigom-chat-container" 
          className="w-full h-full"
        ></div>
      </div>

      <style>{`
        /* mIRC & Custom SDK Styles */
        .custom-chat-wrapper {
          height: 100% !important;
          width: 100% !important;
          background: #000 !important;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        }

        #workigom-chat-container {
          background: #000;
        }

        /* Mobile specific fullscreen adjustment */
        @media (max-width: 768px) {
          #workigom-chat-container {
            position: fixed;
            top: 40px; /* Header height */
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10;
          }
        }

        /* Ensuring the SDK's internal components respect our styling */
        .custom-chat-wrapper * {
          border-radius: 0 !important;
        }

        /* Scanline effect for that retro mIRC vibe */
        #workigom-chat-container::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};


import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const Chat: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Varsa eski scriptleri temizle (tekrar yüklemelerde çakışmayı önlemek için)
    const existingScripts = document.querySelectorAll('script[src*="rumbletalk.com"]');
    existingScripts.forEach(s => s.remove());

    // Script elementini oluştur
    const script = document.createElement('script');
    script.src = "https://rumbletalk.com/client/?yj@y-gRe";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Component unmount olduğunda temizlik yap (Opsiyonel, RumbleTalk bazen global kalmak isteyebilir ama SPA için temizlik iyidir)
      const scripts = document.querySelectorAll('script[src*="rumbletalk.com"]');
      scripts.forEach(s => s.remove());
    };
  }, []);

  return (
    <div className="pb-20 min-h-screen bg-gray-50 font-sans flex flex-col h-[100dvh] overflow-hidden">
       {/* Header */}
       <div className="bg-slate-900 text-white pt-10 pb-4 px-5 flex-shrink-0 md:rounded-b-3xl shadow-sm z-20">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors md:hidden">
                <ChevronLeft size={16} className="text-white" />
            </button>
            <h1 className="text-base font-bold tracking-wide">Topluluk Sohbeti</h1>
         </div>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1 relative z-10 w-full h-full bg-white md:mt-4 md:rounded-3xl md:shadow-lg md:border md:border-gray-100 md:overflow-hidden md:max-w-6xl md:mx-auto">
          {/* RumbleTalk Container ID */}
          <div id="rt-ca35239c280e0266abad1e690e7be78b" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
};

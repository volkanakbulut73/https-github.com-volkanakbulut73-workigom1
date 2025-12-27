import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const Chat: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
       <div className="max-w-xs space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Sohbet Yakında</h2>
          <p className="text-sm text-gray-500">Sohbet özelliği şu anda bakım aşamasındadır. Çok yakında tekrar aktif olacaktır.</p>
          <button 
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 text-slate-900 font-bold hover:underline mx-auto"
          >
            <ChevronLeft size={16} /> Ana Sayfaya Dön
          </button>
       </div>
    </div>
  );
};
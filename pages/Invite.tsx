import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Share2, Users, ShieldCheck, Gift } from 'lucide-react';
import { Button } from '../components/Button';
import { ReferralService } from '../types';

export const Invite: React.FC = () => {
  const navigate = useNavigate();
  const user = ReferralService.getUserProfile();
  const [copied, setCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const inviteLink = `https://workigom.app/ref?code=${user.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Workigom Daveti',
        text: 'Workigom ile yemek ödemelerinden tasarruf et! Benim kodumla üye ol.',
        url: inviteLink
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 font-sans">
      <div className="bg-slate-900 text-white pt-8 pb-28 px-6 rounded-b-[2.5rem] relative shadow-xl">
        <div className="flex items-center mb-4 relative z-10">
           <button onClick={() => navigate(-1)} className="flex items-center text-white/80 hover:text-white transition-colors absolute left-0">
             <ChevronLeft />
           </button>
           <h1 className="text-lg font-bold w-full text-center">Arkadaşını Davet Et</h1>
        </div>
        
        <div className="text-center relative z-10 mt-2">
           <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white backdrop-blur-sm border border-white/20">
             <Gift size={28} />
           </div>
           <h2 className="text-xl font-bold">Kazanmaya Başla!</h2>
           <p className="text-sm text-slate-300 mt-1 max-w-[200px] mx-auto">
             Arkadaşlarını davet et, her işlemlerinden <span className="text-white font-bold">%1 Ödül</span> kazan 💰.
           </p>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10 space-y-6">
        
        <div className="bg-white p-6 rounded-[2rem] shadow-lg text-center border border-gray-100">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">SENİN DAVET KODUN</p>
           <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold text-slate-900 tracking-widest">{user.referralCode}</span>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCopy} className="rounded-xl text-sm">
                 {copied ? 'Kopyalandı' : <><Copy size={16}/> Kopyala</>}
              </Button>
              <Button onClick={handleShare} className="rounded-xl text-sm">
                 <Share2 size={16}/> Paylaş
              </Button>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="font-bold text-gray-800 ml-2">Nasıl Çalışır?</h3>
           <div className="bg-white p-5 rounded-[2rem] shadow-sm space-y-6">
              <Step number="1" title="Arkadaşını Davet Et" desc="Sana özel linki arkadaşlarınla paylaş." />
              <Step number="2" title="Üye Olsunlar" desc="Arkadaşın senin kodunla uygulamaya kayıt olsun." />
              <Step number="3" title="%1 Ödül Kazan" desc="Arkadaşın her ödeme yaptığında tutarın %1'i cüzdanına gelsin!" />
           </div>
        </div>
      </div>
    </div>
  );
};

const Step = ({number, title, desc}: {number: string, title: string, desc: string}) => (
   <div className="flex gap-4 relative">
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-bold flex items-center justify-center shrink-0">
         {number}
      </div>
      <div>
         <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
         <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
   </div>
);
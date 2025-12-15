
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Wallet, Trash2, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { SwapService, SwapListing, ReferralService } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

export const SwapDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<SwapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = ReferralService.getUserProfile();

  useEffect(() => {
    const loadListing = async () => {
        if (!id) return;
        setLoading(true);
        const item = await SwapService.getListingById(id);
        if (item) setListing(item);
        else if (!isSupabaseConfigured()) {
            // Do nothing, UI handles non-configured state
        } else {
            // Item not found but configured
            navigate('/swap'); 
        }
        setLoading(false);
    };
    loadListing();
  }, [id, navigate]);

  if (!isSupabaseConfigured()) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle size={32} className="text-red-500" />
             </div>
             <h2 className="text-lg font-bold text-gray-800 mb-2">Veritabanı Bağlantısı Yok</h2>
             <p className="text-gray-500 text-sm mb-6">Bu özelliği kullanabilmek için Supabase bağlantısının yapılması gerekmektedir.</p>
             <Button onClick={() => navigate('/app')}>Ana Sayfaya Dön</Button>
         </div>
      );
  }

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-white">
           <Loader2 className="animate-spin text-slate-900" size={32} />
        </div>
     );
  }

  if (!listing) return null;

  const isOwner = listing.ownerId === currentUser.id;

  const handleDelete = async () => {
    if(window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
        await SwapService.deleteListing(listing.id);
        navigate('/swap');
    }
  };

  const handleContact = () => {
     navigate(`/messages/${listing.ownerId}`);
  };

  return (
    <div className="pb-24 min-h-screen bg-white md:bg-gray-50 md:py-10">
      
      {/* Container */}
      <div className="md:max-w-5xl md:mx-auto md:bg-white md:rounded-[2rem] md:shadow-xl md:border border-gray-100 md:overflow-hidden md:grid md:grid-cols-2">
        
        {/* Sol Taraf (Resim) */}
        <div className="relative h-72 md:h-full bg-gray-900 overflow-hidden w-full md:border-r border-gray-100">
            <img 
                src={listing.photoUrl} 
                alt={listing.title} 
                className="absolute inset-0 w-full h-full object-contain md:object-cover" 
            />
            
            <div className="absolute top-0 left-0 w-full p-6 pt-8 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-10">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                {isOwner && (
                    <button onClick={handleDelete} className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>

        {/* Sağ Taraf (Bilgiler) */}
        <div className="-mt-6 relative bg-white rounded-t-[2rem] px-6 pt-8 space-y-6 z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] md:mt-0 md:rounded-none md:shadow-none md:p-10 md:flex md:flex-col">
            
            {/* Başlık ve Fiyat */}
            <div className="flex justify-between items-start border-b border-gray-50 pb-6">
                <div className="flex-1 pr-4">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-2 break-words">{listing.title}</h1>
                    <div className="flex items-center text-sm text-gray-500 gap-1 font-medium">
                        <MapPin size={16} className="text-emerald-500" /> {listing.location}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="block text-2xl md:text-4xl font-black text-slate-900">{listing.requiredBalance} ₺</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fiyat</span>
                </div>
            </div>

            {/* İlan Sahibi */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <img 
                    src={listing.ownerAvatar || 'https://picsum.photos/100'} 
                    alt={listing.ownerName} 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" 
                />
                <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{listing.ownerName}</p>
                    <p className="text-xs text-gray-500 font-medium">İlan Sahibi</p>
                </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-2 pb-24 md:pb-0 md:flex-1">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Açıklama</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                    {listing.description || 'Açıklama belirtilmemiş.'}
                </p>
            </div>

            {/* Alt Aksiyon Butonu */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-6 z-40 pb-safe md:static md:p-0 md:border-0">
                {isOwner ? (
                    <Button fullWidth variant="secondary" disabled className="py-4 text-gray-400">Kendi İlanın</Button>
                ) : (
                    <Button fullWidth onClick={handleContact} className="py-4 text-base shadow-xl shadow-slate-900/20">
                        <Wallet className="mr-2" size={20} /> Takas Teklif Et
                    </Button>
                )}
            </div>
        </div>
        
      </div>
    </div>
  );
};

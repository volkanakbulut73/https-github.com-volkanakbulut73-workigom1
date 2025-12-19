
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Tracker } from '../components/Tracker';
import { QrCode, X, Crown, Heart, Utensils, ShoppingBag, ChevronLeft, Loader2, CheckCircle2, MessageCircle, ArrowRight, XCircle, Home, UploadCloud, Wallet, Info, Check, MapPin, Clock, Star, ShieldCheck, Lock, Zap, Smartphone, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackerStep, Transaction, TransactionService, calculateTransaction, DBService, formatName } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const FILTERS = [
  { id: 'all', label: 'Tümü', icon: null },
  { id: 'food', label: 'Yemek', icon: <Utensils size={14} /> },
  { id: 'market', label: 'Market', icon: <ShoppingBag size={14} /> },
];

interface UIListing {
   id: string;
   name: string;
   amount: number;
   location: string;
   time: string;
   rating: number;
   avatar: string;
   description: string;
   type: string;
   isOwn?: boolean;
}

export const Supporters: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'my-support'>('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [listings, setListings] = useState<UIListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  
  const [selectedListing, setSelectedListing] = useState<UIListing | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<20 | 100>(20);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredListings = listings.filter(l => activeFilter === 'all' || l.type === activeFilter);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
        await fetchData();
        if (mounted) setLoading(false);
    };
    init();

    const interval = setInterval(() => {
        if(mounted) fetchData(true);
    }, 15000); 

    return () => {
        mounted = false;
        clearInterval(interval);
    };
  }, []);

  const fetchData = async (silent = false) => {
    if (!isSupabaseConfigured()) {
       setListings([]);
       if (!silent) setLoading(false);
       return;
    }

    if (!silent) setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        
        const rawData = await DBService.getPendingTransactions();
        
        const mappedListings: UIListing[] = rawData.map((item: any) => {
            // Join verisi (profiles) veya direkt item üzerindeki veriyi kontrol et
            const profile = item.profiles || item.seeker || {};
            const isOwn = currentUser && item.seeker_id === currentUser.id;

            return {
              id: item.id,
              name: formatName(profile.full_name || 'Alıcı'),
              amount: item.amount,
              location: profile.location || 'Konum Belirtilmedi', 
              time: 'Aktif',
              rating: profile.rating || 5.0,
              avatar: profile.avatar_url || 'https://picsum.photos/100/100',
              description: item.listing_title || 'Yemek çeki desteği bekliyor.',
              type: 'food',
              isOwn: isOwn
            };
        });
        
        // Sadece başkalarının taleplerini göster (Kullanıcı test için kendi talebini de görebilsin diye bir uyarı ekleyeceğiz)
        setListings(mappedListings);

        if (currentUser) {
           const activeTx = await DBService.getActiveTransaction(currentUser.id);
           if (activeTx && activeTx.supporterId === currentUser.id) {
               setActiveTransaction(activeTx);
               if (activeTab === 'all' && activeTx.status !== TrackerStep.DISMISSED) {
                  setActiveTab('my-support');
               }
           } else if (!activeTx) {
               setActiveTransaction(null);
           }
        }
    } catch (e) {
        console.error("fetchData error:", e);
    } finally {
        if (!silent) setLoading(false);
    }
  };

  const handleSupportClick = (e: React.MouseEvent, listing: UIListing) => {
    e.stopPropagation();
    if (listing.isOwn) {
        alert("Kendi talebinize destek olamazsınız.");
        return;
    }
    if (activeTransaction && 
        activeTransaction.status !== TrackerStep.COMPLETED && 
        activeTransaction.status !== TrackerStep.DISMISSED && 
        activeTransaction.status !== TrackerStep.CANCELLED && 
        activeTransaction.status !== TrackerStep.FAILED) {
      
      alert("Devam eden bir işleminiz var.");
      setActiveTab('my-support');
      return;
    }
    setSelectedListing(listing);
    setSelectedPercentage(20);
    setShowSelectionModal(true);
  };

  const handleConfirmSupport = async () => {
    if (!selectedListing || isProcessing) return;
    setIsProcessing(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const updated = await DBService.acceptTransaction(selectedListing.id, user.id, selectedPercentage);
        
        const realTx: Transaction = {
          id: updated.id,
          seekerId: updated.seeker_id,
          supporterId: user.id,
          amount: updated.amount,
          listingTitle: updated.listing_title,
          status: updated.status,
          supportPercentage: updated.support_percentage,
          createdAt: updated.created_at,
          seekerName: selectedListing.name,
          supporterName: 'Ben',
          amounts: calculateTransaction(updated.amount, updated.support_percentage)
        };

        setActiveTransaction(realTx);
        setActiveTab('my-support');
        setShowSelectionModal(false);
    } catch (err: any) {
        alert("Hata: " + (err.message || "İşlem kabul edilemedi."));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeTransaction) return;
      setQrUploading(true);
      try {
          const url = await DBService.uploadQR(file);
          await DBService.submitQR(activeTransaction.id, url);
          setActiveTransaction({ ...activeTransaction, status: TrackerStep.QR_UPLOADED, qrUrl: url });
      } catch (err: any) {
          alert("QR Yükleme Hatası: " + err.message);
      } finally { setQrUploading(false); }
  };

  const handleCancelTransaction = async () => {
    if (!activeTransaction) return;
    if (!window.confirm("Desteği geri çekmek istiyor musunuz?")) return;
    try {
        await DBService.withdrawSupport(activeTransaction.id);
        setActiveTransaction(null);
        setActiveTab('all');
        fetchData();
    } catch (e) { alert("Hata oluştu."); }
  };

  const handleDismissTransaction = async () => {
     if (activeTransaction) await DBService.dismissTransaction(activeTransaction.id);
     setActiveTransaction(null);
     setActiveTab('all');
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      <div className="bg-slate-900 text-white pt-10 pb-10 px-5 rounded-b-[1.5rem] shadow-sm relative z-20">
         <div className="relative z-30 flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-wide">Paylaşım Talepleri</h1>
         </div>
      </div>

      <div className="px-4 -mt-6 relative z-20 space-y-4">
        <div className="bg-white p-1 rounded-xl flex gap-1 border border-gray-200 shadow-sm max-w-sm mx-auto">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              Talepler
            </button>
            <button onClick={() => setActiveTab('my-support')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'my-support' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              Paylaşımlarım
            </button>
        </div>

        {activeTab === 'all' && (
          <>
            <div className="flex justify-between items-center">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {FILTERS.map(filter => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeFilter === filter.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                        {filter.label}
                    </button>
                ))}
                </div>
                <button onClick={() => fetchData(false)} className="p-2 bg-white rounded-full shadow-sm text-slate-900">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {loading ? (
                 <div className="text-center py-20 text-gray-400">
                    <Loader2 size={32} className="animate-spin mx-auto mb-3" />
                    <p className="text-xs font-bold">Veriler Getiriliyor...</p>
                 </div>
              ) : listings.filter(l => !l.isOwn).length === 0 ? (
                 <div className="text-center py-16 px-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag size={32} className="text-gray-300"/>
                    </div>
                    <p className="text-sm font-bold text-gray-800">Şu an aktif talep bulunmuyor.</p>
                    <p className="text-xs text-gray-400 mt-1">Sizin oluşturduğunuz talepler bu listede görünmez.</p>
                    <button onClick={() => fetchData(false)} className="mt-4 text-slate-900 text-xs font-bold underline flex items-center justify-center gap-1 mx-auto">
                        <RefreshCw size={12}/> Listeyi Yenile
                    </button>
                 </div>
              ) : (
                 listings.filter(l => !l.isOwn && (activeFilter === 'all' || l.type === activeFilter)).map((listing) => (
                   <div key={listing.id} onClick={(e) => handleSupportClick(e, listing)} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <img src={listing.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="User" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">{listing.name}</h3>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                    <MapPin size={10} /> {listing.location}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-xl font-black text-slate-900">{listing.amount}₺</div>
                             <div className="text-[9px] font-bold text-gray-400 uppercase">Menü Tutarı</div>
                        </div>
                     </div>

                     <p className="text-slate-600 text-xs mb-6 line-clamp-2 italic">"{listing.description}"</p>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Alacağın Nakit</p>
                            <p className="text-sm font-black text-emerald-600">₺{(listing.amount * 0.75).toFixed(0)}</p>
                        </div>
                        <div className="bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-emerald-200">
                            Paylaş & Kazan <ArrowRight size={14} />
                        </div>
                     </div>
                   </div>
                 ))
              )}
            </div>
          </>
        )}

        {activeTab === 'my-support' && (
          <div className="animate-fade-in max-w-md mx-auto">
             {!activeTransaction ? (
               <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Heart size={32} className="text-gray-300"/>
                 </div>
                 <h3 className="text-gray-900 font-bold text-sm mb-1">Henüz destek olmadınız</h3>
                 <button onClick={() => setActiveTab('all')} className="mt-4 text-emerald-600 font-bold text-xs underline">Taleplere Göz At</button>
               </div>
             ) : (
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border-l-4 border-slate-900 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">Destek: {activeTransaction.seekerName}</h3>
                            <p className="text-[10px] text-gray-500">İşlem ID: {activeTransaction.id.slice(0,8)}</p>
                        </div>
                        <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-slate-900"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/></button>
                    </div>

                    <Tracker 
                        currentStep={activeTransaction.status} 
                        steps={[
                            { id: TrackerStep.WAITING_CASH_PAYMENT, label: 'Ödeme' },
                            { id: TrackerStep.CASH_PAID, label: 'QR Hazırla' },
                            { id: TrackerStep.QR_UPLOADED, label: 'QR Yüklendi' }, 
                            { id: TrackerStep.COMPLETED, label: 'Tamamlandı' }
                        ]} 
                    />

                    <div className="pt-2 border-t border-gray-50">
                        {activeTransaction.status === TrackerStep.CASH_PAID && (
                            <div className="space-y-3">
                                <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500 shrink-0"/>
                                    <p className="text-[10px] font-bold text-green-700">Alıcı ödeme yaptı! QR yükleyebilirsin.</p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleQRUpload} className="hidden" accept="image/*" />
                                <Button fullWidth className="text-xs py-3" onClick={() => fileInputRef.current?.click()} disabled={qrUploading}>
                                    {qrUploading ? <Loader2 size={16} className="animate-spin"/> : 'QR Kodunu Yükle'}
                                </Button>
                            </div>
                        )}
                        {activeTransaction.status === TrackerStep.COMPLETED && (
                             <Button fullWidth onClick={handleDismissTransaction} className="bg-emerald-500">İşlemi Kapat</Button>
                        )}
                        <div className="mt-4 text-center">
                            <button onClick={handleCancelTransaction} className="text-red-400 text-[10px] font-bold">İptal Et</button>
                        </div>
                    </div>
                </div>
             )}
          </div>
        )}
      </div>

      {showSelectionModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-fade-in">
            <button onClick={() => !isProcessing && setShowSelectionModal(false)} className="absolute top-5 right-5 text-gray-400" disabled={isProcessing}><X size={20} /></button>
            <h3 className="text-lg font-black text-slate-900 mb-6">Paylaşım Oranı</h3>
            <div className="space-y-4">
                <div onClick={() => !isProcessing && setSelectedPercentage(20)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPercentage === 20 ? 'border-slate-900 bg-slate-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between font-bold text-sm mb-1"><span>%20 Paylaşım</span><span>₺{(selectedListing.amount * 0.2).toFixed(0)}</span></div>
                    <p className="text-[10px] text-gray-500">Standart yardımlaşma oranı.</p>
                </div>
                <div onClick={() => !isProcessing && setSelectedPercentage(100)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPercentage === 100 ? 'border-pink-500 bg-pink-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between font-bold text-sm mb-1 text-pink-600"><span>%100 Buda Benden</span><span>₺{selectedListing.amount}</span></div>
                    <p className="text-[10px] text-pink-400">Yemek bedelinin tamamını üstlen.</p>
                </div>
            </div>
            <div className="mt-8 flex gap-3">
                <Button fullWidth variant="secondary" onClick={() => setShowSelectionModal(false)} disabled={isProcessing}>Vazgeç</Button>
                <Button fullWidth onClick={handleConfirmSupport} disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin" /> : 'Onayla'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

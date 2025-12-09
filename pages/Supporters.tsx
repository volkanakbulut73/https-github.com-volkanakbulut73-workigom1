
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Tracker } from '../components/Tracker';
import { QrCode, X, Crown, Heart, Utensils, ShoppingBag, ChevronLeft, Loader2, CheckCircle2, MessageCircle, ArrowRight, XCircle, Home, UploadCloud, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackerStep, Transaction, TransactionService, calculateTransaction, DBService, formatName } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const FILTERS = [
  { id: 'all', label: 'Tümü', icon: null },
  { id: 'food', label: 'Yemek', icon: <Utensils size={10} /> },
  { id: 'market', label: 'Market', icon: <ShoppingBag size={10} /> },
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredListings = listings.filter(l => activeFilter === 'all' || l.type === activeFilter);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (listings.length === 0) setLoading(true);

    if (!isSupabaseConfigured()) {
       if (listings.length === 0) {
           const mockListings: UIListing[] = [
              { id: '1', name: 'Ahmet Y.', amount: 1000, location: 'Kadıköy', time: '5 dk', rating: 4.8, avatar: 'https://picsum.photos/100/100', description: 'Öğle yemeği için yardım lazım', type: 'food' },
              { id: '2', name: 'Zeynep K.', amount: 1200, location: 'Beşiktaş', time: '12 dk', rating: 5.0, avatar: 'https://picsum.photos/101/101', description: 'Migros alışverişi', type: 'market' },
              { id: '3', name: 'Can B.', amount: 80, location: 'Şişli', time: '20 dk', rating: 4.5, avatar: 'https://picsum.photos/102/102', description: 'Kahve dünyası', type: 'food' },
              { id: '4', name: 'Elif S.', amount: 450, location: 'Ataşehir', time: '30 dk', rating: 4.9, avatar: 'https://picsum.photos/103/103', description: 'Burger King', type: 'food' },
           ];
           setListings(mockListings);
       }
       const current = TransactionService.getActive();
       setActiveTransaction(current || null);
       setLoading(false);
       return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const pendingData = await DBService.getPendingTransactions();
        
        const filteredData = user 
            ? pendingData.filter((item: any) => item.seeker_id !== user.id)
            : pendingData;
        
        const mappedListings: UIListing[] = filteredData.map((item: any) => ({
              id: item.id,
              name: formatName(item.profiles?.full_name),
              amount: item.amount,
              location: item.profiles?.location || 'Konum Yok',
              time: 'Az önce',
              rating: item.profiles?.rating || 5.0,
              avatar: item.profiles?.avatar_url || 'https://picsum.photos/100/100',
              description: item.listing_title || 'Açıklama yok',
              type: 'food' 
        }));
        setListings(mappedListings);

        if (user) {
           const activeTx = await DBService.getActiveTransaction(user.id);
           
           if (activeTx && activeTx.supporter_id === user.id) {
              const appTx: Transaction = {
                 id: activeTx.id,
                 listingId: activeTx.id,
                 seekerId: activeTx.seeker_id,
                 supporterId: activeTx.supporter_id,
                 seekerName: formatName(activeTx.seeker?.full_name),
                 supporterName: activeTx.supporter?.full_name || 'Ben',
                 supportPercentage: activeTx.support_percentage as 20 | 100,
                 amounts: calculateTransaction(activeTx.amount, activeTx.support_percentage as 20 | 100),
                 status: activeTx.status as TrackerStep,
                 createdAt: new Date(activeTx.created_at).getTime(),
                 qrUrl: activeTx.qr_url,
                 qrUploadedAt: activeTx.qr_uploaded_at ? new Date(activeTx.qr_uploaded_at).getTime() : undefined
              };
              setActiveTransaction(appTx);
              
              if (activeTab === 'all' && appTx.status !== TrackerStep.COMPLETED && appTx.status !== TrackerStep.CANCELLED && appTx.status !== TrackerStep.FAILED) {
                  setActiveTab('my-support');
              }
           } else {
              setActiveTransaction(null);
           }
        }
    } catch (e) {
        console.error("Fetch error", e);
    }
    setLoading(false);
  };

  const handleSupportClick = (e: React.MouseEvent, listing: UIListing) => {
    e.stopPropagation();
    if (activeTransaction && activeTransaction.status !== TrackerStep.COMPLETED && activeTransaction.status !== TrackerStep.CANCELLED && activeTransaction.status !== TrackerStep.FAILED) {
      alert("Devam eden bir işleminiz var.");
      setActiveTab('my-support');
      return;
    }
    setSelectedListing(listing);
    setShowSelectionModal(true);
  };

  const handleConfirmSupport = async (percentage: 20 | 100) => {
    if (!selectedListing || isProcessing) return;
    setIsProcessing(true);

    const calc = calculateTransaction(selectedListing.amount, percentage);
    
    const mockTx: Transaction = {
          id: `tx-${Date.now()}`,
          listingId: selectedListing.id,
          seekerId: 'seeker-uuid',
          seekerName: selectedListing.name,
          supporterId: 'current-user',
          supporterName: 'Ben',
          supportPercentage: percentage,
          amounts: calc,
          status: TrackerStep.WAITING_CASH_PAYMENT,
          createdAt: Date.now()
    };

    try {
        if (!isSupabaseConfigured()) {
            TransactionService.save(mockTx);
            setActiveTransaction(mockTx);
            setListings(prev => prev.filter(l => l.id !== selectedListing.id));
            setActiveTab('my-support');
            setShowSelectionModal(false);
            setSelectedListing(null);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const updatedTx = await DBService.acceptTransaction(selectedListing.id, user.id, percentage);
        
        const realTx: Transaction = {
          ...mockTx,
          id: updatedTx.id,
          seekerId: updatedTx.seeker_id,
          supporterId: user.id
        };

        setActiveTransaction(realTx);
        setActiveTab('my-support');
        setListings(prev => prev.filter(l => l.id !== selectedListing.id));
        setShowSelectionModal(false);
        setSelectedListing(null);

    } catch (Z: any) {
        alert("Hata oluştu: " + (Z.message || "Bilinmiyor"));
        try { fetchData(); } catch (e) {}
    } finally {
        setIsProcessing(false);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeTransaction) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("Dosya boyutu çok büyük (Max 5MB)");
          return;
      }

      setQrUploading(true);
      try {
          const publicUrl = await DBService.uploadQR(file);
          await DBService.submitQR(activeTransaction.id, publicUrl);

          const updated = {
              ...activeTransaction,
              status: TrackerStep.QR_UPLOADED,
              qrUrl: publicUrl,
              qrUploadedAt: Date.now()
          };
          setActiveTransaction(updated);
          TransactionService.save(updated);
          if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error: any) {
          alert("QR yüklenirken hata: " + (error.message || "Bilinmeyen hata"));
      } finally {
          setQrUploading(false);
      }
  };

  const handleCancelTransaction = async () => {
    if (!activeTransaction) return;
    if (!window.confirm("İşlemden desteğinizi çekmek istediğinize emin misiniz?")) return;
    
    const txId = activeTransaction.id;
    const previousTx = activeTransaction; 

    TransactionService.clearActive();
    setActiveTransaction(null);

    try {
        if (isSupabaseConfigured()) {
            await DBService.withdrawSupport(txId);
        }
    } catch (e: any) {
        console.error("Background cancel failed", e);
        setActiveTransaction(previousTx);
        TransactionService.save(previousTx);
        alert("İşlem iptal edilemedi.");
    }
  };

  const handleClearActive = async () => {
    if (activeTransaction && isSupabaseConfigured()) {
        await DBService.dismissTransaction(activeTransaction.id);
    }
    setActiveTransaction(null);
    TransactionService.clearActive();
    navigate('/');
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      <div className="bg-slate-900 text-white pt-10 pb-10 px-5 rounded-b-[1.5rem] md:rounded-3xl shadow-sm relative z-20 md:mb-6">
         <div className="relative z-30 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors md:hidden">
                <ChevronLeft size={16} className="text-white" />
            </button>
            <h1 className="text-sm font-bold tracking-wide">Paylaşım Talepleri</h1>
         </div>
      </div>

      <div className="px-4 -mt-6 md:mt-0 relative z-20 space-y-3">
        <div className="bg-white p-1 rounded-xl flex gap-1 border border-gray-200 shadow-sm max-w-sm mx-auto md:mx-0">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              Paylaşım Bekleyenler
            </button>
            <button onClick={() => setActiveTab('my-support')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'my-support' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              Paylaşımlarım
            </button>
        </div>

        {activeTab === 'all' && (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
               {FILTERS.map(filter => (
                  <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${activeFilter === filter.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 border-gray-200'}`}>
                     {filter.icon} {filter.label}
                  </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading ? (
                 <div className="col-span-full text-center py-6 text-gray-400"><Loader2 size={20} className="animate-spin mx-auto mb-2" /><p className="text-[10px]">Yükleniyor...</p></div>
              ) : filteredListings.length === 0 ? (
                 <div className="col-span-full text-center py-6 text-gray-400 bg-white rounded-xl border border-gray-100"><p className="text-[10px]">Talep yok.</p></div>
              ) : (
                 filteredListings.map((listing) => (
                   <div key={listing.id} onClick={(e) => handleSupportClick(e, listing)} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform flex items-center gap-3 cursor-pointer hover:shadow-md">
                     <div className="w-12 h-12 shrink-0 rounded-full bg-gray-50 overflow-hidden border border-gray-100 relative group">
                        <img src={listing.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="User" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <h3 className="text-slate-800 font-bold text-sm">{listing.name}</h3>
                           <span className="text-xs font-bold text-slate-900 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg">{listing.amount} ₺</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{listing.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{listing.location}</span>
                           <span className="text-[9px] text-gray-400">• {listing.time}</span>
                        </div>
                     </div>
                     <button className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">Paylaş</button>
                   </div>
                 ))
              )}
            </div>
          </>
        )}

        {activeTab === 'my-support' && (
          <div className="animate-fade-in max-w-md mx-auto">
             {!activeTransaction ? (
               <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                 <Heart size={24} className="mx-auto text-gray-300 mb-2"/>
                 <p className="text-[10px] text-gray-400">Aktif paylaşım işleminiz bulunmuyor.</p>
               </div>
             ) : (
                <>
                {activeTransaction.status === TrackerStep.CANCELLED ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center animate-fade-in border border-red-50">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">İşlem İptal Edildi</h2>
                        <Button fullWidth onClick={handleClearActive} className="bg-gray-800 hover:bg-gray-900 text-xs">
                            <Home size={14} className="mr-2" /> Ana Sayfaya Dön
                        </Button>
                    </div>
                ) : activeTransaction.status === TrackerStep.FAILED ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center animate-fade-in border border-red-50">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">Ödeme Başarısız</h2>
                        <Button fullWidth onClick={handleClearActive} className="bg-gray-800 hover:bg-gray-900 text-xs">
                            <Home size={14} className="mr-2" /> Listeye Dön
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] p-5 shadow-sm border-l-4 border-slate-900 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Destek: {activeTransaction.seekerName}</h3>
                                <p className="text-[10px] text-gray-500">
                                    {activeTransaction.supportPercentage === 20 ? 'Standart Destek (%20)' : 'Altın Kalp Destek (%100)'}
                                </p>
                            </div>
                        </div>

                        <Tracker 
                            currentStep={activeTransaction.status} 
                            steps={[
                                { id: TrackerStep.SUPPORT_CONFIRMED, label: 'Onaylandı' }, 
                                { id: TrackerStep.WAITING_CASH_PAYMENT, label: 'Ödeme' },
                                { id: TrackerStep.QR_UPLOADED, label: 'QR Yükle' }, 
                                { id: TrackerStep.PAYMENT_CONFIRMED, label: 'POS Onayı' }
                            ]} 
                        />

                        <div className="pt-2 border-t border-gray-50">
                            {activeTransaction.status === TrackerStep.WAITING_CASH_PAYMENT && (
                                <div className="text-center p-3 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
                                    <p className="text-xs font-bold text-blue-800 mb-1">
                                        {activeTransaction.supportPercentage === 20 
                                        ? 'Ödeme Bekleniyor'
                                        : 'Ödeme Beklenmiyor'}
                                    </p>
                                </div>
                            )}

                            {activeTransaction.status === TrackerStep.CASH_PAID && (
                                <div className="space-y-3">
                                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0"/>
                                        <p className="text-[10px] font-bold text-green-700">
                                        Ödeme yapıldı!
                                        </p>
                                    </div>
                                    
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleQRUpload} 
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                    
                                    <Button fullWidth className="text-xs py-3" onClick={() => fileInputRef.current?.click()} disabled={qrUploading}>
                                        {qrUploading ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin"/> Yükleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud size={16} className="mr-2"/> 
                                                {activeTransaction.amounts.supportAmount} TL'lik QR Yükle
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {activeTransaction.status === TrackerStep.QR_UPLOADED && (
                                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <p className="text-xs font-bold text-amber-800 mb-1">QR Kodu Gönderildi</p>
                                    <p className="text-[10px] text-amber-600">POS onayı bekleniyor...</p>
                                </div>
                            )}

                            {activeTransaction.status === TrackerStep.COMPLETED && (
                                <div className="bg-emerald-50 p-5 rounded-[2rem] text-center border border-emerald-100">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-emerald-500">
                                        <Wallet size={32} />
                                    </div>
                                    <h3 className="text-base font-black text-emerald-800 mb-1">İşlem Tamamlandı!</h3>
                                    <Button fullWidth className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-200" onClick={handleClearActive}>
                                        Listeye Dön
                                    </Button>
                                </div>
                            )}

                            {activeTransaction.status !== TrackerStep.COMPLETED && (
                                <div className="mt-4 pt-2 border-t border-gray-50 text-center">
                                    <button 
                                        onClick={handleCancelTransaction}
                                        className="text-red-300 text-[10px] font-bold py-1 px-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        İşlemi İptal Et
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </>
             )}
          </div>
        )}
      </div>

      {showSelectionModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { if(!isProcessing) { setShowSelectionModal(false); } }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              disabled={isProcessing}
            >
              <X size={18} />
            </button>
            
            <div className="mb-5 pr-6">
                <h3 className="text-base font-bold text-slate-900">Paylaşım Seçimi</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedListing.name} için paylaşım oranını seçin</p>
            </div>

            <div className="space-y-3">
                <div className="border border-slate-900/10 rounded-3xl p-4 bg-slate-50">
                    <div className="flex justify-between items-center text-slate-900 mb-2">
                        <span className="font-bold text-xs">%20 Paylaşım</span>
                        <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Standart</span>
                    </div>
                    <Button 
                        fullWidth 
                        onClick={() => handleConfirmSupport(20)} 
                        disabled={isProcessing}
                        className="bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Seç ve İlerle'}
                    </Button>
                </div>

                <div className="border border-yellow-200 rounded-3xl p-4 bg-yellow-50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-yellow-800">%100 Buda Benden 🩷</span>
                    </div>
                    <Button 
                        fullWidth 
                        onClick={() => handleConfirmSupport(100)} 
                        disabled={isProcessing}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl border-yellow-400"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Devam Et'}
                    </Button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

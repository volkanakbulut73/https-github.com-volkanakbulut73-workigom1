
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
}

export const Supporters: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'my-support'>('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [listings, setListings] = useState<UIListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  
  // Modal States
  const [selectedListing, setSelectedListing] = useState<UIListing | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState<20 | 100>(20);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredListings = listings.filter(l => activeFilter === 'all' || l.type === activeFilter);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
        if (mounted && loading) {
            setLoading(false);
            console.warn("Loading timed out - forcing render");
        }
    }, 5000); // 5 saniye sonra yüklemeyi zorla kapat

    fetchData();
    
    // Polling - 15 saniyede bir güncelle
    const interval = setInterval(() => {
        if(mounted) fetchData(true); // true = silent update (loading gösterme)
    }, 15000); 

    return () => {
        mounted = false;
        clearTimeout(safetyTimer);
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
        
        // Veritabanından veriyi çek
        const pendingData = await DBService.getPendingTransactions();
        
        // Kendi oluşturduğumuz talepleri listeden çıkar (Seeker bizsek görmeyelim)
        const filteredData = currentUser 
            ? pendingData.filter((item: any) => item.seeker_id !== currentUser.id)
            : pendingData;
        
        const mappedListings: UIListing[] = filteredData.map((item: any) => ({
              id: item.id,
              name: formatName(item.profiles?.full_name || 'Kullanıcı'),
              amount: item.amount,
              location: item.profiles?.location || 'Konum Yok', 
              time: 'Az önce',
              rating: item.profiles?.rating || 5.0,
              avatar: item.profiles?.avatar_url || 'https://picsum.photos/100/100',
              description: item.listing_title || 'Açıklama yok',
              type: 'food' 
        }));
        
        setListings(mappedListings);

        if (currentUser) {
           // Aktif işlem kontrolü
           const activeTx = await DBService.getActiveTransaction(currentUser.id);
           
           if (activeTx && activeTx.supporterId === currentUser.id) {
               setActiveTransaction(activeTx);
              
              if (activeTab === 'all' && 
                  activeTx.status !== TrackerStep.DISMISSED && 
                  activeTx.status !== TrackerStep.CANCELLED) {
                  // Eğer aktif bir desteğim varsa otomatik o taba geç
                  setActiveTab('my-support');
              }
           } else {
              // Eğer veritabanından null geldiyse state'i de temizle
              if (activeTx === null) {
                  setActiveTransaction(null);
              }
           }
        }
    } catch (e) {
        console.error("Fetch error", e);
    } finally {
        if (!silent) setLoading(false);
    }
  };

  const handleSupportClick = (e: React.MouseEvent, listing: UIListing) => {
    e.stopPropagation();
    if (activeTransaction && 
        activeTransaction.status !== TrackerStep.COMPLETED && 
        activeTransaction.status !== TrackerStep.DISMISSED && 
        activeTransaction.status !== TrackerStep.CANCELLED && 
        activeTransaction.status !== TrackerStep.FAILED) {
      
      alert("Zaten devam eden bir işleminiz var. Lütfen önce onu tamamlayın.");
      setActiveTab('my-support');
      return;
    }
    setSelectedListing(listing);
    setSelectedPercentage(20); // Default to 20
    setShowSelectionModal(true);
  };

  const handleConfirmSupport = async () => {
    if (!selectedListing || isProcessing) return;
    setIsProcessing(true);

    const percentage = selectedPercentage;
    
    try {
        if (!isSupabaseConfigured()) {
            throw new Error("Veritabanı bağlantısı yok");
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const updatedTx = await DBService.acceptTransaction(selectedListing.id, user.id, percentage);
        
        // Re-construct proper Transaction object from DB response
        const realTx: Transaction = {
          id: updatedTx.id,
          seekerId: updatedTx.seeker_id,
          supporterId: user.id,
          amount: updatedTx.amount,
          listingTitle: updatedTx.listing_title,
          status: updatedTx.status,
          supportPercentage: updatedTx.support_percentage,
          createdAt: updatedTx.created_at,
          seekerName: selectedListing.name,
          supporterName: 'Ben',
          amounts: calculateTransaction(updatedTx.amount, updatedTx.support_percentage)
        };

        setActiveTransaction(realTx);
        setActiveTab('my-support');
        setListings(prev => prev.filter(l => l.id !== selectedListing.id));
        setShowSelectionModal(false);
        setSelectedListing(null);

    } catch (Z: any) {
        console.error(Z);
        alert("İşlem kabul edilirken hata oluştu: " + (Z.message || "Bilinmiyor"));
        fetchData(); // Refresh to ensure sync
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

          const updated: Transaction = {
              ...activeTransaction,
              status: TrackerStep.QR_UPLOADED,
              qrUrl: publicUrl,
              qrUploadedAt: new Date().toISOString()
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

  const handleDismissTransaction = async () => {
    if (activeTransaction && isSupabaseConfigured()) {
        await DBService.dismissTransaction(activeTransaction.id);
    }
    setActiveTransaction(null);
    TransactionService.clearActive();
    setActiveTab('all');
    navigate('/supporters');
  };

  // Helper for UI calculations
  const getCalculatedValues = (amount: number, percentage: 20 | 100) => {
      if (percentage === 100) {
          return {
              contribution: amount, // Full amount
              fee: 0,
              totalPay: amount,
              netReceive: 0,
              beneficiaryPays: 0
          };
      }
      
      const contribution = amount * 0.20; 
      const beneficiaryPays = amount * 0.80; 
      const fee = amount * 0.05; 
      const totalCostToSupporter = contribution + fee; 
      const netReceive = beneficiaryPays - fee; 

      return {
          contribution,
          fee,
          totalPay: totalCostToSupporter,
          netReceive,
          beneficiaryPays
      };
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

      <div className="px-4 -mt-6 md:mt-0 relative z-20 space-y-4">
        <div className="bg-white p-1 rounded-xl flex gap-1 border border-gray-200 shadow-sm max-w-sm mx-auto md:mx-0">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
              Paylaşım Bekleyenler
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
                        {filter.icon} {filter.label}
                    </button>
                ))}
                </div>
                
                <button 
                    onClick={() => fetchData(false)}
                    className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-slate-900 hover:bg-gray-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {loading ? (
                 <div className="col-span-full text-center py-10 text-gray-400"><Loader2 size={32} className="animate-spin mx-auto mb-3" /><p className="text-xs">Yükleniyor...</p></div>
              ) : filteredListings.length === 0 ? (
                 <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100"><p className="text-sm font-medium">Şu an aktif talep bulunmuyor.</p></div>
              ) : (
                 filteredListings.map((listing) => (
                   <div key={listing.id} onClick={(e) => handleSupportClick(e, listing)} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden">
                     
                     {/* 1. HEADER: User + Active Badge */}
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={listing.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt="User" />
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">{listing.name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                    <span>{listing.rating} • 23 işlem</span>
                                </div>
                            </div>
                        </div>
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md shadow-emerald-200">
                            Aktif
                        </span>
                     </div>

                     {/* 2. BODY: Description + Price Box */}
                     <div className="flex justify-between items-center gap-4 mb-8">
                        <div className="flex items-start gap-3 flex-1">
                             <div className="w-2.5 h-2.5 rounded-full border border-gray-300 mt-1.5 shrink-0"></div>
                             <p className="text-slate-700 font-medium text-sm leading-relaxed">
                                 {listing.description || `${listing.type === 'food' ? 'Yemek' : 'Market'} harcaması için destek arıyor.`}
                             </p>
                        </div>

                        <div className="bg-emerald-500 text-white p-4 rounded-2xl text-center min-w-[120px] shadow-xl shadow-emerald-500/20 shrink-0 transform group-hover:scale-105 transition-transform duration-300">
                             <div className="text-xl font-black tracking-tight">{listing.amount}₺</div>
                             <div className="text-[10px] font-bold text-emerald-50 opacity-90">Menü Tutarı</div>
                        </div>
                     </div>

                     {/* 3. TRUST BADGES */}
                     <div className="flex items-center justify-between gap-1 mb-6 px-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                             <Lock size={12} className="text-slate-800" /> Escrow Güvencesi
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                             <Smartphone size={12} className="text-slate-800" /> QR ile Ödeme
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                             <Zap size={12} className="text-slate-800" /> Anında Transfer
                        </div>
                     </div>

                     {/* 4. CTA BUTTON */}
                     <div className="text-center">
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            Paylaş & Kazan <ArrowRight size={16} />
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                            İşlem Workigom güvencesiyle yapılır
                        </p>
                     </div>

                   </div>
                 ))
              )}
            </div>
          </>
        )}

        {/* Tab Content for 'my-support' */}
        {activeTab === 'my-support' && (
          <div className="animate-fade-in max-w-md mx-auto">
             {!activeTransaction ? (
               <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Heart size={32} className="text-gray-300"/>
                 </div>
                 <h3 className="text-gray-900 font-bold text-sm mb-1">Henüz destek olmadınız</h3>
                 <p className="text-xs text-gray-400">Listeden bir talep seçerek başlayın.</p>
                 <button onClick={() => setActiveTab('all')} className="mt-4 text-emerald-600 font-bold text-xs underline">Taleplere Göz At</button>
               </div>
             ) : (
                <>
                {activeTransaction.status === TrackerStep.CANCELLED ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center animate-fade-in border border-red-50">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">İşlem İptal Edildi</h2>
                        <Button fullWidth onClick={handleDismissTransaction} className="bg-gray-800 hover:bg-gray-900 text-xs">
                            <Home size={14} className="mr-2" /> Ana Sayfaya Dön
                        </Button>
                    </div>
                ) : activeTransaction.status === TrackerStep.FAILED ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center animate-fade-in border border-red-50">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">Ödeme Başarısız</h2>
                        <Button fullWidth onClick={handleDismissTransaction} className="bg-gray-800 hover:bg-gray-900 text-xs">
                            <Home size={14} className="mr-2" /> Listeye Dön
                        </Button>
                    </div>
                ) : activeTransaction.status === TrackerStep.COMPLETED ? (
                    <div className="bg-white p-8 rounded-[2rem] shadow-lg text-center animate-fade-in border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-sm">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-1 tracking-tight">İşlem Başarılı!</h2>
                        <p className="text-xs text-gray-400 font-medium mb-6">Ödeme ve transfer tamamlandı.</p>
                        
                        <div className="bg-emerald-50 rounded-2xl p-5 mb-6 border border-emerald-100">
                             <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1">Hesabınıza aktarılacak tutar</p>
                             <p className="text-3xl font-black text-emerald-600">{activeTransaction.amounts.refundToSupporter} ₺</p>
                        </div>

                        <Button fullWidth onClick={handleDismissTransaction} className="bg-slate-900 hover:bg-slate-800 shadow-slate-200 py-3.5 rounded-xl">
                            <Home size={16} className="mr-2" /> Ana Sayfaya Dön
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
                            <button onClick={() => fetchData(true)} className="text-gray-400 hover:text-slate-900"><RefreshCw size={14}/></button>
                        </div>

                        <Tracker 
                            currentStep={activeTransaction.status} 
                            steps={[
                                { id: TrackerStep.WAITING_CASH_PAYMENT, label: 'Ödeme' }, // Onaylandı step is implicit or can be re-added
                                { id: TrackerStep.CASH_PAID, label: 'QR Hazırla' },
                                { id: TrackerStep.QR_UPLOADED, label: 'QR Yüklendi' }, 
                                { id: TrackerStep.COMPLETED, label: 'Tamamlandı' }
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
                                    <p className="text-[10px] text-blue-600">Alıcı nakit ödeme yapınca QR yükleyeceksin.</p>
                                </div>
                            )}

                            {activeTransaction.status === TrackerStep.CASH_PAID && (
                                <div className="space-y-3">
                                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0"/>
                                        <p className="text-[10px] font-bold text-green-700">
                                        Alıcı ödeme yaptı! Lütfen ödeme yapıp QR yükle.
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

                            <div className="mt-4 pt-2 border-t border-gray-50 text-center">
                                <button 
                                    onClick={handleCancelTransaction}
                                    className="text-red-300 text-[10px] font-bold py-1 px-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    İşlemi İptal Et
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </>
             )}
          </div>
        )}
      </div>

      {showSelectionModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#FFFCF8] w-full max-w-sm rounded-[2rem] p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in border border-white/20">
            <button 
              onClick={() => { if(!isProcessing) { setShowSelectionModal(false); } }} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>
            
            <div className="mb-6 pt-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Paylaşım Seçimi</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">{selectedListing.name} için paylaşım oranını seçin</p>
            </div>

            <div className="space-y-4">
                {/* 20% Option */}
                {(() => {
                    const values = getCalculatedValues(selectedListing.amount, 20);
                    const isSelected = selectedPercentage === 20;
                    return (
                        <div 
                            onClick={() => !isProcessing && setSelectedPercentage(20)}
                            className={`rounded-[1.5rem] p-5 cursor-pointer transition-all duration-200 border relative overflow-hidden group
                            ${isSelected 
                                ? 'bg-white border-slate-900 shadow-xl shadow-slate-200 ring-1 ring-slate-900/5' 
                                : 'bg-white border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-black text-sm text-slate-900">%20 Paylaşım</span>
                                <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full">Standart</span>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 font-medium">
                                <div className="flex justify-between">
                                    <span>Senin katkın (İndirim):</span>
                                    <span className="font-bold text-slate-900">{values.contribution} ₺</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Platform ücreti: %5</span>
                                    <span className="font-bold text-slate-900">{values.fee} ₺</span>
                                </div>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-700">Toplam Maliyetin:</span>
                                    <span className="font-black text-slate-900">{values.totalPay} ₺</span>
                                </div>
                            </div>

                            <div className="mt-4 bg-[#E3F5E6] rounded-xl p-3 text-center border border-[#CAEAD0]">
                                <p className="text-[#1F542A] text-xs font-bold">Hesabına aktarılacak:</p>
                                <p className="text-[#1F542A] text-xl font-black">{values.netReceive} ₺</p>
                                <p className="text-[#3A7E49] text-[9px] font-bold mt-1">Yararlanıcı {values.beneficiaryPays} ₺ ödeyecek</p>
                            </div>
                        </div>
                    );
                })()}

                {/* 100% Option */}
                {(() => {
                    const values = getCalculatedValues(selectedListing.amount, 100);
                    const isSelected = selectedPercentage === 100;
                    return (
                        <div 
                            onClick={() => !isProcessing && setSelectedPercentage(100)}
                            className={`rounded-[1.5rem] p-5 cursor-pointer transition-all duration-200 border relative overflow-hidden group
                            ${isSelected 
                                ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-100 ring-1 ring-yellow-400/20' 
                                : 'bg-white border-gray-200 hover:border-yellow-200'}`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-sm text-slate-900">%100 Buda Benden</span>
                                    <Heart size={14} className="text-pink-500 fill-pink-500" />
                                </div>
                                <span className="bg-[#FFB703] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">Altın Kalp</span>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 font-medium">
                                <div className="flex justify-between">
                                    <span>Senin katkın:</span>
                                    <span className="font-bold text-slate-900">{values.contribution} ₺</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Platform ücreti:</span>
                                    <span className="font-bold text-slate-900">%0 - Buda Bizden olsun 😉</span>
                                </div>
                            </div>

                            <div className="mt-4 bg-[#FFF9E6] rounded-xl p-3 text-center border border-[#FDE68A]">
                                <p className="text-[#B45309] text-[10px] font-bold leading-tight mb-2">Yemek ücretinin tamamını ödemeyi kabul ettiniz.</p>
                                <div className="flex justify-between items-center bg-white/50 rounded-lg px-3 py-1.5">
                                    <span className="text-[#B45309] text-[10px] font-bold">Hesabınıza aktarılacak tutar:</span>
                                    <span className="text-[#B45309] font-black text-sm">0 ₺</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="mt-6 flex gap-3">
                <button 
                    onClick={() => setShowSelectionModal(false)}
                    className="flex-1 bg-[#F1F5F9] text-slate-600 font-bold text-sm py-3.5 rounded-2xl hover:bg-gray-200 transition-colors"
                    disabled={isProcessing}
                >
                    iptal
                </button>
                <button 
                    onClick={handleConfirmSupport}
                    className="flex-[2] bg-[#0F172A] text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Devam Et'}
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Tracker } from '../components/Tracker';
import { QrCode, X, Crown, Heart, Utensils, ShoppingBag, ChevronLeft, Loader2, CheckCircle2, MessageCircle, ArrowRight, XCircle, Home, UploadCloud, Wallet, Info, Check, MapPin, Clock, Star, ShieldCheck, Lock, Zap, Smartphone, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackerStep, Transaction, calculateTransaction, DBService, formatName } from '../types';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const ignoreNextFetchRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
        await fetchData();
        if (mounted) setLoading(false);
    };
    init();

    const interval = setInterval(() => {
        if(mounted && !isProcessing && !ignoreNextFetchRef.current) {
            fetchData(true);
        }
    }, 3000); 

    return () => {
        mounted = false;
        clearInterval(interval);
    };
  }, [isProcessing]);

  const fetchData = async (silent = false) => {
    if (!isSupabaseConfigured()) return;
    if (!silent) setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (!currentUser) return;
        
        const rawData = await DBService.getPendingTransactions();
        const mappedListings: UIListing[] = rawData.map((item: any) => {
            const profile = item.profiles || item.seeker || {};
            const isOwn = item.seeker_id === currentUser.id;
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
        setListings(mappedListings);

        if (!ignoreNextFetchRef.current) {
            const activeTx = await DBService.getActiveTransaction(currentUser.id);
            if (activeTx && activeTx.supporterId === currentUser.id) {
                setActiveTransaction(activeTx);
            } else if (!activeTx && activeTransaction) {
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
    setErrorMsg(null);
    if (listing.isOwn) {
        alert("Kendi talebinize destek olamazsınız.");
        return;
    }
    if (activeTransaction && 
        activeTransaction.status !== TrackerStep.COMPLETED && 
        activeTransaction.status !== TrackerStep.DISMISSED && 
        activeTransaction.status !== TrackerStep.CANCELLED) {
      
      alert("Zaten devam eden bir işleminiz var.");
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
    setErrorMsg(null);
    ignoreNextFetchRef.current = true; 

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const updated = await DBService.acceptTransaction(selectedListing.id, user.id, selectedPercentage);
        
        if (!updated) throw new Error("İşlem verisi alınamadı.");

        const realTx: Transaction = {
          id: updated.id,
          seekerId: updated.seeker_id,
          supporterId: user.id,
          amount: updated.amount,
          listingTitle: updated.listing_title,
          status: updated.status as TrackerStep,
          supportPercentage: updated.support_percentage as (20 | 100),
          createdAt: updated.created_at,
          seekerName: selectedListing.name,
          supporterName: 'Ben',
          amounts: calculateTransaction(updated.amount, updated.support_percentage as (20 | 100))
        };

        setActiveTransaction(realTx);
        setActiveTab('my-support');
        setShowSelectionModal(false);

        setTimeout(() => {
            ignoreNextFetchRef.current = false;
        }, 5000);

    } catch (err: any) {
        console.error("Support acceptance error:", err);
        setErrorMsg(err.message || "İşlem başarısız.");
        ignoreNextFetchRef.current = false; 
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
    setLoading(true);
    try {
        await DBService.withdrawSupport(activeTransaction.id);
        setActiveTransaction(null);
        navigate('/app'); 
    } catch (e: any) { 
        alert("Hata oluştu: " + (e.message || "Hata")); 
    } finally {
        setLoading(false);
    }
  };

  const handleDismissTransaction = async () => {
     try {
         if (activeTransaction) await DBService.dismissTransaction(activeTransaction.id);
         setActiveTransaction(null);
         navigate('/app'); 
     } catch (e) {
         setActiveTransaction(null);
         navigate('/app');
     }
  };

  const calc20 = selectedListing ? calculateTransaction(selectedListing.amount, 20) : null;
  const calc100 = selectedListing ? calculateTransaction(selectedListing.amount, 100) : null;

  return (
    <div className="pb-24 min-h-screen bg-[#F8FAFC] relative font-sans">
      <div className="bg-slate-900 text-white pt-12 pb-14 px-6 rounded-b-[3rem] shadow-2xl relative z-20 overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
         <div className="relative z-30 flex items-center gap-4">
            <button onClick={() => navigate('/app')} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-95">
              <ChevronLeft size={20}/>
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">Paylaşım Talepleri</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Topluluk Dayanışma Havuzu</p>
            </div>
         </div>
      </div>

      <div className="px-6 -mt-8 relative z-30 space-y-6">
        <div className="bg-white p-1.5 rounded-2xl flex gap-1 border border-slate-100 shadow-sm max-w-sm mx-auto">
            <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-gray-50'}`}>
              Talepler
            </button>
            <button onClick={() => setActiveTab('my-support')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my-support' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-gray-50'}`}>
              İşlemlerim
            </button>
        </div>

        {activeTab === 'all' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {FILTERS.map(filter => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === filter.id ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border-slate-100'}`}>
                        {filter.label}
                    </button>
                ))}
                </div>
                <button onClick={() => fetchData(false)} className="w-10 h-10 bg-white rounded-2xl shadow-sm text-slate-900 flex items-center justify-center active:scale-90 transition-transform">
                    <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : ''} />
                </button>
            </div>

            <div className="flex flex-col gap-5 max-w-2xl mx-auto">
              {loading ? (
                 <div className="text-center py-20">
                    <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" strokeWidth={1.5} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Havuz Taranıyor...</p>
                 </div>
              ) : listings.filter(l => !l.isOwn).length === 0 ? (
                 <div className="text-center py-20 px-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-fade-in">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={32} className="text-slate-300"/>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Henüz talep yok.</h3>
                    <p className="text-xs text-slate-400 font-medium px-6 leading-relaxed mb-8">Yeni bir paylaşım talebi geldiğinde burada anında listelenecektir.</p>
                    <button onClick={() => fetchData(false)} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                        <RefreshCw size={14}/> Listeyi Güncelle
                    </button>
                 </div>
              ) : (
                 listings.filter(l => !l.isOwn && (activeFilter === 'all' || l.type === activeFilter)).map((listing) => (
                   <div key={listing.id} onClick={(e) => handleSupportClick(e, listing)} className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group relative overflow-hidden animate-fade-in">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                              <img src={listing.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xl" alt="User" />
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-lg border-2 border-white shadow-sm">
                                <Zap size={10} className="text-white fill-white" />
                              </div>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm tracking-tight">{listing.name}</h3>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    <MapPin size={10} className="text-emerald-500" /> {listing.location}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-black text-slate-900 tracking-tighter">₺{listing.amount}</div>
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Yemek Tutarı</div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 italic text-slate-600 text-[11px] leading-relaxed">
                        "{listing.description}"
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1 opacity-70">Sana Ödenecek</p>
                            <p className="text-lg font-black text-emerald-600 tracking-tight">₺{(listing.amount * 0.75).toFixed(0)} <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-normal">Nakit</span></p>
                        </div>
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                            Hemen Destek Ol <ArrowRight size={16} />
                        </div>
                     </div>
                   </div>
                 ))
              )}
            </div>
          </div>
        )}

        {/* İşlemlerim Tab İçeriği ... (Aynı Mantıkla UI İyileştirilebilir) */}
        {activeTab === 'my-support' && (
          <div className="animate-fade-in max-w-md mx-auto">
             {!activeTransaction ? (
               <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                     <Heart size={32} className="text-slate-300"/>
                 </div>
                 <h3 className="text-slate-900 font-black text-sm mb-2 tracking-tight">Aktif işleminiz yok.</h3>
                 <p className="text-xs text-slate-400 font-medium px-10 mb-8">Henüz kimsenin talebine destek olmadınız.</p>
                 <button onClick={() => setActiveTab('all')} className="px-8 py-3.5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Taleplere Göz At</button>
               </div>
             ) : (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm tracking-tight">İşlem: {activeTransaction.seekerName}</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{activeTransaction.id.slice(0,8).toUpperCase()}</p>
                        </div>
                        <button onClick={() => fetchData(true)} className="w-10 h-10 bg-slate-50 rounded-2xl text-slate-400 flex items-center justify-center active:rotate-180 transition-transform duration-500">
                            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : ''}/>
                        </button>
                    </div>

                    <Tracker 
                        currentStep={activeTransaction.status} 
                        steps={[
                            { id: TrackerStep.WAITING_SUPPORTER, label: 'Eşleşme' },
                            { id: TrackerStep.WAITING_CASH_PAYMENT, label: 'Ödeme Bekleniyor' },
                            { id: TrackerStep.CASH_PAID, label: 'QR Hazırlanıyor' },
                            { id: TrackerStep.QR_UPLOADED, label: 'QR Paylaşıldı' }, 
                            { id: TrackerStep.COMPLETED, label: 'Tamamlandı' }
                        ]} 
                    />

                    {/* QR Yükleme ve Diğer Aksiyonlar ... */}
                    <div className="pt-6 border-t border-slate-50">
                        {activeTransaction.status === TrackerStep.CASH_PAID && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-blue-50 p-5 rounded-2xl flex items-start gap-4 border border-blue-100/50">
                                    <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5"/>
                                    <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-tighter">Karşı taraf ödemeyi onayladı! Şimdi QR kodu veya PIN'i paylaşma sırası sende.</p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleQRUpload} className="hidden" accept="image/*" />
                                <Button fullWidth className="py-5 shadow-2xl shadow-slate-900/10 bg-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest" onClick={() => fileInputRef.current?.click()} disabled={qrUploading}>
                                    {qrUploading ? <Loader2 size={20} className="animate-spin"/> : <><QrCode size={20}/> QR Kodunu Paylaş</>}
                                </Button>
                            </div>
                        )}
                        {/* Diğer durumlar için butonlar ve mesajlar ... */}
                    </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* MODAL VE DİĞER ELEMENTLER ... (Görsel tutarlılık için benzer güncellemeler yapılabilir) */}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, Clock, Star, Loader2, Info, XCircle, Home, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Tracker } from '../components/Tracker';
import { Transaction, TrackerStep, TransactionService, ReferralService, User, DBService, calculateTransaction, formatName } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const FindShare: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>('1000');
  const [description, setDescription] = useState('');
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeTxRef = useRef<Transaction | null>(null);

  useEffect(() => {
    activeTxRef.current = activeTransaction;
  }, [activeTransaction]);

  useEffect(() => {
    const init = async () => {
        if (!isSupabaseConfigured()) return;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const tx = await DBService.getActiveTransaction(session.user.id);
                if (tx) setActiveTransaction(tx);
            }
        } catch (e) {
            console.warn("Init check failed", e);
        }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeTransaction?.id || !isSupabaseConfigured()) return;

    if (activeTransaction.status === TrackerStep.COMPLETED || 
        activeTransaction.status === TrackerStep.FAILED || 
        activeTransaction.status === TrackerStep.CANCELLED || 
        activeTransaction.status === TrackerStep.DISMISSED) return;

    const channel = supabase.channel(`tx_${activeTransaction.id}`)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'transactions',
            filter: `id=eq.${activeTransaction.id}`
        }, async (payload) => {
            const newData = payload.new;
            setActiveTransaction(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: newData.status,
                    supporterId: newData.supporter_id,
                    supportPercentage: newData.support_percentage,
                    qrUrl: newData.qr_url,
                    qrUploadedAt: newData.qr_uploaded_at,
                    completedAt: newData.completed_at,
                    amounts: calculateTransaction(newData.amount, newData.support_percentage)
                };
            });
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTransaction?.id]); 

  const handleCreateRequest = async () => {
    if (creating) return; 
    setCreating(true);

    try {
      if (!isSupabaseConfigured()) throw new Error("Sistem yapılandırılmamış.");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
          throw new Error("Lütfen önce giriş yapın.");
      }

      const val = parseFloat(amount);
      if (isNaN(val) || val < 50 || val > 5000) {
         throw new Error("Tutar 50 - 5000 TL arasında olmalıdır.");
      }

      const newTxData = await DBService.createTransactionRequest(session.user.id, val, description);
      
      const realTx: Transaction = {
          id: newTxData.id,
          seekerId: session.user.id,
          amount: val,
          listingTitle: description,
          status: TrackerStep.WAITING_SUPPORTER,
          supportPercentage: 20,
          amounts: calculateTransaction(val, 20),
          createdAt: newTxData.created_at,
          seekerName: 'Ben'
      };

      TransactionService.save(realTx); 
      setActiveTransaction(realTx);
      setDescription('');
      
    } catch (error: any) {
      console.error("Create TX Error:", error);
      alert(error.message || "İşlem oluşturulurken bir hata oluşti.");
    } finally {
      setCreating(false);
    }
  };

  // ... rest of the functions (handleCashPaid, etc) remain similar but without mock checks
  const handleCashPaid = async () => {
    if (!activeTransaction) return;
    try {
        setLoading(true);
        await DBService.markCashPaid(activeTransaction.id);
        setActiveTransaction(prev => prev ? { ...prev, status: TrackerStep.CASH_PAID } : null);
    } catch (e) {
        alert("Güncelleme hatası.");
    } finally {
        setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!activeTransaction) return;
    try {
        await DBService.completeTransaction(activeTransaction.id);
        setActiveTransaction(prev => prev ? { ...prev, status: TrackerStep.COMPLETED } : null);
    } catch (e) {
        alert("Hata oluştu.");
    }
  };

  const handleCancelTransaction = async () => {
    if (!activeTransaction) return;
    if (!window.confirm("İptal etmek istiyor musunuz?")) return;
    setLoading(true);
    try {
        await DBService.cancelTransaction(activeTransaction.id);
        setActiveTransaction(null);
        TransactionService.clearActive();
        navigate('/app'); 
    } catch (e) { alert("Hata."); }
    finally { setLoading(false); }
  };

  const handleClearActive = () => {
     TransactionService.clearActive();
     setActiveTransaction(null);
     navigate('/app'); 
  };

  if (activeTransaction) {
    return (
      <div className="pb-32 min-h-screen bg-gray-50 font-sans">
        <div className="bg-slate-900 text-white pt-4 pb-14 px-6 rounded-b-[3rem] relative shadow-xl">
          <div className="flex justify-between items-center mb-2">
             <button onClick={() => navigate(-1)} className="flex items-center text-white/80 hover:text-white transition-colors">
               <ChevronLeft /> <span className="text-sm font-medium ml-1">Geri</span>
             </button>
             <h1 className="text-lg font-bold">İşlem Detayı</h1>
             <div className="w-6"></div> 
          </div>
        </div>

        <div className="px-6 -mt-8 relative z-10 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
                <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-slate-900 rounded-full"></span>
                    İşlem Takibi
                </h2>
                <Tracker 
                    currentStep={activeTransaction.status}
                    steps={[
                        { id: TrackerStep.WAITING_SUPPORTER, label: 'Eşleşme' },
                        { id: TrackerStep.WAITING_CASH_PAYMENT, label: 'Ödemeniz' },
                        { id: TrackerStep.CASH_PAID, label: 'QR Hazırlama' },
                        { id: TrackerStep.QR_UPLOADED, label: 'QR Yüklendi' },
                        { id: TrackerStep.COMPLETED, label: 'Tamamlandı' }
                    ]}
                />
                
                {activeTransaction.status === TrackerStep.WAITING_SUPPORTER && (
                   <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                       <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                           <Clock className="text-amber-500 animate-pulse" />
                       </div>
                       <p className="text-xs font-bold text-gray-600">Destekçi bekleniyor...</p>
                   </div>
                )}
            </div>

            {activeTransaction.status === TrackerStep.WAITING_CASH_PAYMENT && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm animate-fade-in">
                    <p className="text-sm text-gray-700 mb-4">Destekçiye <strong>₺{activeTransaction.amounts.seekerPayment}</strong> ödeme yapın.</p>
                    <Button fullWidth onClick={handleCashPaid} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin"/> : 'Ödemeyi Yaptım'}
                    </Button>
                </div>
            )}

            {activeTransaction.status === TrackerStep.QR_UPLOADED && activeTransaction.qrUrl && (
                <div className="bg-white p-6 rounded-[2rem] shadow-xl text-center space-y-4">
                    <img src={activeTransaction.qrUrl} className="w-48 h-48 mx-auto border-4 border-gray-50 rounded-xl" alt="QR"/>
                    <div className="flex gap-2">
                        <Button fullWidth variant="danger" onClick={() => alert("Hata bildirildi.")}>Hata Var</Button>
                        <Button fullWidth variant="success" onClick={handlePaymentSuccess}>Onayla</Button>
                    </div>
                </div>
            )}

            {activeTransaction.status === TrackerStep.COMPLETED && (
                <div className="bg-white p-8 rounded-[2rem] text-center">
                    <Star className="mx-auto text-yellow-400 mb-4" size={48}/>
                    <h2 className="text-xl font-bold mb-4">İşlem Tamam!</h2>
                    <Button fullWidth onClick={handleClearActive}>Kapat</Button>
                </div>
            )}

            {activeTransaction.status !== TrackerStep.COMPLETED && (
                <button onClick={handleCancelTransaction} className="w-full text-red-500 text-xs font-bold py-4">İşlemi İptal Et</button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50 font-sans">
      <div className="bg-slate-900 text-white pt-10 pb-10 px-5 rounded-b-[1.5rem] shadow-sm relative z-20">
         <div className="relative z-30 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <ChevronLeft size={16} className="text-white" />
            </button>
            <h1 className="text-sm font-bold tracking-wide">Paylaşım Talebi Oluştur</h1>
         </div>
      </div>

      <div className="px-6 -mt-6 relative z-30 space-y-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm">
           <div className="space-y-4">
              <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Menü Tutarı (TL)</label>
                  <input 
                     type="number" 
                     value={amount}
                     onChange={(e) => setAmount(e.target.value)}
                     className="w-full text-2xl font-black text-slate-800 bg-gray-50 rounded-xl p-4 mt-1 outline-none"
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Açıklama</label>
                  <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full mt-1 bg-gray-50 rounded-xl p-4 text-sm font-medium h-24 resize-none outline-none"
                     placeholder="Restoran adı veya konum..."
                  />
              </div>

              <Button fullWidth onClick={handleCreateRequest} disabled={creating} className="py-4">
                  {creating ? <Loader2 className="animate-spin" /> : 'Paylaşım Talebi Oluştur'}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

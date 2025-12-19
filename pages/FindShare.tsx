
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
  const [formError, setFormError] = useState<string | null>(null);

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
                    status: newData.status as TrackerStep,
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
    setFormError(null);

    try {
      if (!isSupabaseConfigured()) throw new Error("Bağlantı ayarları eksik.");

      // Oturum Kontrolü (Zaman aşımı korumalı)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Oturum kontrolü zaman aşımına uğradı. Lütfen sayfayı yenileyin.")), 6000)
      );
      
      const { data: { session } } = (await Promise.race([sessionPromise, timeoutPromise])) as any;
      
      if (!session?.user) {
          throw new Error("İşlem yapmak için giriş yapmanız gerekiyor.");
      }

      const val = parseFloat(amount);
      if (isNaN(val) || val < 50 || val > 5000) {
         throw new Error("Lütfen 50 - 5000 TL arası geçerli bir tutar girin.");
      }

      // Veritabanı Kaydı (Daha uzun zaman aşımı korumalı)
      const dbRequest = DBService.createTransactionRequest(session.user.id, val, description);
      const dbTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Sunucu şu an yanıt vermiyor. Lütfen birkaç saniye sonra tekrar deneyin.")), 12000)
      );
      
      const newTxData = (await Promise.race([dbRequest, dbTimeout])) as any;
      
      if (!newTxData) throw new Error("İşlem verisi alınamadı.");

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
      // JSON parse hataları veya ağ hataları durumunda kullanıcıyı bilgilendir
      let msg = error.message || "Bir bağlantı hatası oluştu.";
      if (msg.includes("JSON")) msg = "Sunucu bağlantısı sırasında bir hata oluştu. Lütfen tekrar deneyin.";
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleCashPaid = async () => {
    if (!activeTransaction) return;
    try {
        setLoading(true);
        await DBService.markCashPaid(activeTransaction.id);
        setActiveTransaction(prev => prev ? { ...prev, status: TrackerStep.CASH_PAID } : null);
    } catch (e) {
        setFormError("Durum güncellenemedi.");
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
        setFormError("Onay işlemi başarısız.");
    }
  };

  const handleCancelTransaction = async () => {
    if (!activeTransaction) return;
    if (!window.confirm("Talebinizi iptal etmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
        await DBService.cancelTransaction(activeTransaction.id);
        setActiveTransaction(null);
        TransactionService.clearActive();
        navigate('/app'); 
    } catch (e) { 
        setFormError("İptal işlemi başarısız."); 
    } finally { 
        setLoading(false); 
    }
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
             <h1 className="text-lg font-bold">İşlem Takibi</h1>
             <div className="w-6"></div> 
          </div>
        </div>

        <div className="px-6 -mt-8 relative z-10 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm">
                <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-slate-900 rounded-full"></span>
                    Durum Paneli
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
                       <p className="text-[10px] text-gray-400 mt-2 px-10">Talebiniz topluluk havuzunda yayınlandı. Destekçi gelince bildirim alacaksınız.</p>
                   </div>
                )}
            </div>

            {activeTransaction.status === TrackerStep.WAITING_CASH_PAYMENT && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm animate-fade-in border-2 border-slate-900/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl"><Wallet size={20}/></div>
                        <h3 className="font-bold text-slate-900">Ödeme Gerekiyor</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        Destekçiye <strong>₺{activeTransaction.amounts.seekerPayment}</strong> tutarında ödemeyi yaptıktan sonra aşağıdaki butona basın.
                    </p>
                    <Button fullWidth onClick={handleCashPaid} disabled={loading} className="py-4 shadow-lg shadow-slate-900/20">
                        {loading ? <Loader2 className="animate-spin"/> : '✅ Ödemeyi Yaptım'}
                    </Button>
                </div>
            )}

            {activeTransaction.status === TrackerStep.QR_UPLOADED && activeTransaction.qrUrl && (
                <div className="bg-white p-6 rounded-[2rem] shadow-xl text-center space-y-4 border-2 border-emerald-500/10">
                    <div className="p-4 bg-emerald-50 rounded-2xl inline-block mb-2">
                        <img src={activeTransaction.qrUrl} className="w-48 h-48 mx-auto rounded-xl" alt="QR"/>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 text-lg">QR Hazır!</h3>
                        <p className="text-xs text-gray-500 px-6">Lütfen restoran kasasında bu kodu okutun ve işlem tamamlandığında onaylayın.</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button fullWidth variant="danger" className="py-3" onClick={() => alert("Hata bildiriminiz destek ekibine iletilecek.")}>Hata Bildir</Button>
                        <Button fullWidth variant="success" className="py-3 shadow-lg shadow-emerald-500/20" onClick={handlePaymentSuccess}>Onayla</Button>
                    </div>
                </div>
            )}

            {activeTransaction.status === TrackerStep.COMPLETED && (
                <div className="bg-white p-8 rounded-[2rem] text-center shadow-xl border-2 border-emerald-500/10 animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-emerald-500 fill-emerald-500" size={40}/>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Harika! 🎉</h2>
                    <p className="text-sm text-gray-500 mb-6">Tasarrufunuz cüzdanınıza yansıtılacak. Başka bir işlem için hazırsınız!</p>
                    <Button fullWidth onClick={handleClearActive} className="py-4">Kapat</Button>
                </div>
            )}

            {activeTransaction.status !== TrackerStep.COMPLETED && (
                <div className="pt-4">
                    <button onClick={handleCancelTransaction} className="w-full text-red-500 text-xs font-bold py-4 hover:bg-red-50 rounded-2xl transition-colors">İşlemi İptal Et</button>
                </div>
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
              {formError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-fade-in">
                      <AlertTriangle size={16} className="shrink-0" />
                      {formError}
                  </div>
              )}

              <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Harcanacak Tutar (TL)</label>
                  <div className="relative mt-1">
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-2xl font-black text-slate-800 bg-gray-50 rounded-xl p-4 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">₺</span>
                  </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Açıklama (Opsiyonel)</label>
                  <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full mt-1 bg-gray-50 rounded-xl p-4 text-sm font-medium h-24 resize-none outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                     placeholder="Örn: Restoran adı veya bölge..."
                  />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      Talebiniz yayınlandığında, yemek kartı bakiyesi olan bir destekçi ile eşleşeceksiniz. Destekçi QR kodunu paylaştığında işlem başlayacaktır.
                  </p>
              </div>

              <Button fullWidth onClick={handleCreateRequest} disabled={creating} className="py-4 text-sm shadow-xl shadow-slate-900/10">
                  {creating ? <Loader2 className="animate-spin" /> : 'Paylaşım Talebi Yayınla'}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

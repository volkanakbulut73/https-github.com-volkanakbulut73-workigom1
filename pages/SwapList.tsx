
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Heart, Loader2, SlidersHorizontal, ChevronDown, X, ChevronLeft, Trash2, Tag, User } from 'lucide-react';
import { SwapService, SwapListing, ReferralService } from '../types';

export const SwapList: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<SwapListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  // Profil değişimini dinlemek için state kullanıyoruz ancak useEffect'e ID'yi dahil etmeyeceğiz.
  const [currentUser, setCurrentUser] = useState(ReferralService.getUserProfile());

  // Profil güncellemelerini dinle (Sadece filtreleme için, veri çekme için değil)
  useEffect(() => {
    const handleStorage = () => setCurrentUser(ReferralService.getUserProfile());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      // 3 Saniye zaman aşımı (Timeout)
      const timeoutPromise = new Promise<SwapListing[]>((resolve) => {
          setTimeout(() => resolve([]), 3000); 
      });

      const dataPromise = SwapService.getListings();
      
      // Veri veya Timeout hangisi önce gelirse
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Eğer sonuç boş bir dizi ise ve timeout sebebiyle değilse tekrar kontrol edelim
      // Ancak UI'ın kilitlenmemesi için her durumda state'i güncelliyoruz.
      if (result && Array.isArray(result)) {
         setListings(result);
      } else {
         setListings([]);
      }
    } catch (e) {
      console.error("Listings load error:", e);
      setListings([]);
    } finally {
      // ÖNEMLİ: Her durumda loading kapanmalı
      setLoading(false);
    }
  };

  useEffect(() => { 
      // currentUser.id bağımlılığını kaldırdık. 
      // Çünkü veri tabanındaki tüm ilanları çekiyoruz, kişiye özel değil.
      // Kişiye özel filtreleme client-side (filteredListings) yapılıyor.
      loadListings();
  }, []); 

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
          await SwapService.deleteListing(id);
          loadListings(); // Listeyi yenile
      }
  };

  const safeStr = (val: any): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return '';
  };

  const safeNum = (val: any): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const filteredListings = listings.filter(l => {
    if (!l) return false;
    
    // Search Filter
    const title = safeStr(l.title).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = title.includes(search);

    // Tab Filter
    const matchesTab = activeTab === 'all' ? true : l.ownerId === currentUser.id;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="pb-24 min-h-screen bg-gray-50 font-sans">
      
      {/* HEADER & FILTERS - Masaüstünde ortalanmış ve yuvarlatılmış */}
      <div className="bg-slate-900 pt-10 pb-6 px-4 rounded-b-[2rem] md:rounded-3xl shadow-sm sticky top-0 z-30 md:static md:mb-8 md:mt-4 md:mx-4 lg:mx-auto lg:max-w-6xl">
        
        {/* Top Bar: Back & Search */}
        <div className="flex items-center gap-3 mb-4 max-w-4xl mx-auto">
           <button 
             onClick={() => navigate(-1)} 
             className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors md:hidden"
           >
              <ChevronLeft size={20} />
           </button>
           
           <div className="flex-1 relative">
              <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Ürün, marka veya kategori ara..."
                 className="w-full bg-white/10 border border-white/5 rounded-2xl py-3 pl-11 pr-10 text-xs text-white placeholder-gray-400 outline-none focus:bg-white/20 focus:border-white/10 transition-all font-medium"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                 <Search size={16} />
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-500/30 rounded-full p-1 text-gray-300 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
           </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
            {/* TABS */}
            <div className="bg-white/10 p-1 rounded-xl flex gap-1">
                <button 
                    onClick={() => setActiveTab('all')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                >
                <Tag size={12} /> Pazar
                </button>
                <button 
                    onClick={() => setActiveTab('my')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:bg-white/5'}`}
                >
                <User size={12} /> İlanlarım
                </button>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button className="flex items-center gap-1.5 bg-[#FF80AB] text-white px-4 py-2 rounded-xl text-[10px] font-bold shrink-0 shadow-lg shadow-pink-500/20 active:scale-95 transition-transform">
                    <SlidersHorizontal size={12} /> Filtrele
                </button>
                
                {['Sırala', 'Fiyat Aralığı', 'Konum', 'Kategori'].map((f, i) => (
                    <button key={i} className="flex items-center gap-1.5 bg-white/5 text-gray-300 px-4 py-2 rounded-xl text-[10px] font-bold shrink-0 border border-white/5 hover:bg-white/10 transition-colors active:scale-95">
                        {f} <ChevronDown size={12} className="opacity-50" />
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* FAB */}
      <button 
        onClick={() => navigate('/swap/create')} 
        className="fixed bottom-24 right-5 md:bottom-10 md:right-10 bg-slate-900 text-white w-14 h-14 rounded-full shadow-xl shadow-slate-900/40 flex items-center justify-center z-40 active:scale-90 transition-transform hover:scale-105 border-4 border-white/10 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* CONTENT GRID */}
      <div className="px-4 mt-4 relative z-20 max-w-6xl mx-auto">
         <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-bold text-slate-800 text-sm md:text-xl">
                {activeTab === 'all' ? 'Vitrin Ürünleri' : 'İlanlarım'}
            </h2>
            <button onClick={loadListings} className="text-[10px] md:text-xs text-primary font-bold flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
               {loading && <Loader2 size={10} className="animate-spin"/>} Yenile
            </button>
         </div>

         {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <Loader2 size={32} className="animate-spin text-primary mb-2" />
               <p className="text-xs">Yükleniyor...</p>
            </div>
         ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
               <p className="text-gray-400 text-sm font-medium">
                   {activeTab === 'all' 
                    ? 'Aradığınız kriterlere uygun ilan bulunamadı veya listelenemedi.' 
                    : 'Henüz hiç ilan oluşturmadınız.'}
               </p>
               {activeTab === 'all' && (
                  <div className="flex flex-col gap-2 mt-4">
                      <button onClick={() => setSearchTerm('')} className="text-primary text-xs font-bold">Aramayı Temizle</button>
                      <button onClick={loadListings} className="text-emerald-500 text-xs font-bold bg-emerald-50 px-4 py-2 rounded-lg">Tekrar Dene</button>
                  </div>
               )}
               {activeTab === 'my' && (
                  <button onClick={() => navigate('/swap/create')} className="mt-2 text-primary text-xs font-bold">İlk İlanını Oluştur</button>
               )}
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-4">
               {filteredListings.map((item, index) => {
                  if (!item) return null;
                  const itemId = safeStr(item.id) || `fallback-${index}`;
                  const itemTitle = safeStr(item.title);
                  const itemPhoto = safeStr(item.photoUrl);
                  const itemOwnerName = safeStr(item.ownerName);
                  const itemOwnerAvatar = safeStr(item.ownerAvatar);
                  const itemPrice = safeNum(item.requiredBalance);
                  
                  const isOwner = item.ownerId === currentUser.id;

                  return (
                    <div 
                      key={itemId} 
                      onClick={() => navigate(`/swap/${itemId}`)} 
                      className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-gray-200 group flex flex-col h-full"
                    >
                       <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden mb-3">
                          <img 
                            src={itemPhoto} 
                            alt={itemTitle} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
  
                          {isOwner ? (
                             <button 
                                onClick={(e) => handleDelete(e, itemId)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-sm z-10"
                             >
                                <Trash2 size={14} />
                             </button>
                          ) : (
                             <button 
                                onClick={(e) => { e.stopPropagation(); }}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all shadow-sm z-10"
                             >
                                <Heart size={14} className={index % 2 === 0 ? "fill-red-500 text-red-500" : "text-white"} />
                             </button>
                          )}
                          
                          <div className="absolute bottom-2 left-2 bg-[#FF80AB] px-2 py-1 rounded-lg shadow-sm">
                             <span className="text-[8px] font-black text-white uppercase tracking-wide">YENİ GİBİ</span>
                          </div>
                       </div>
  
                       <div className="px-1 space-y-1 flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-2">
                             <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-2 leading-snug min-h-[2.5em]">
                                {itemTitle}
                             </h3>
                          </div>
                          
                          <div className="flex items-center gap-1.5 py-1">
                             <img src={itemOwnerAvatar} alt={itemOwnerName} className="w-4 h-4 rounded-full border border-gray-100" />
                             <span className="text-[9px] text-gray-400 font-medium truncate max-w-[80px]">
                               {isOwner ? 'Sen' : itemOwnerName}
                             </span>
                          </div>
  
                          <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-auto">
                             <div className="flex flex-col">
                                <span className="text-sm md:text-base font-black text-slate-900">{itemPrice} ₺</span>
                             </div>
                             {!isOwner && (
                                <button className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-md shadow-slate-900/20 group-hover:scale-110 transition-transform">
                                    <Plus size={14} />
                                </button>
                             )}
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         )}
      </div>
    </div>
  );
};

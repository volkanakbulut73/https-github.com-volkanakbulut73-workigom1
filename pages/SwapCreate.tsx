
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Wallet, X } from 'lucide-react';
import { Button } from '../components/Button';
import { SwapService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SwapCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tempPhoto = 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&auto=format&fit=crop&q=60';

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("Dosya boyutu çok büyük (Max 5MB)");
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return;

    setIsLoading(true);
    try {
        if (isSupabaseConfigured()) {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (!session) {
               alert("İlan oluşturmak için lütfen giriş yapın.");
               navigate('/login');
               return;
            }
        }

        let finalPhoto = tempPhoto;
        if (selectedFile) {
           finalPhoto = await SwapService.uploadImage(selectedFile);
        }
        await SwapService.createListing(title, desc, parseInt(price), finalPhoto);
        navigate('/swap');
    } catch (error: any) {
        console.error("Create Listing Error:", error);
        
        let message = 'Bilinmeyen bir hata oluştu.';
        if (typeof error === 'string') message = error;
        else if (error instanceof Error) message = error.message;
        else if (typeof error === 'object' && error !== null) {
             message = error.message || error.error_description || JSON.stringify(error);
        }
        
        if (typeof message !== 'string' || message === '[object Object]') {
             message = 'İşlem başarısız oldu. Lütfen tekrar deneyin.';
        }
        
        alert(`Hata: ${message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:py-10">
      
      {/* Container: Mobilde tam ekran, Masaüstünde ortalanmış kart */}
      <div className="flex-1 w-full md:max-w-2xl md:mx-auto bg-white md:rounded-3xl md:shadow-xl md:border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-white px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 z-20 shadow-sm md:shadow-none border-b border-gray-100">
             <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                 <ChevronLeft size={20} className="text-gray-600" />
             </button>
             <h1 className="font-bold text-lg text-gray-800">İlan Oluştur</h1>
             <div className="w-10"></div>
          </div>
    
          <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto">
             {/* Photo Upload Area */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ürün Fotoğrafı</label>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
    
                <div 
                    onClick={handleImageClick}
                    className={`h-48 md:h-64 w-full rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative overflow-hidden shadow-inner
                        ${selectedImage ? 'border-0 bg-gray-900' : 'bg-white border-2 border-dashed border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                    {selectedImage ? (
                        <>
                            <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                            <button 
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-10"
                            >
                                <X size={16} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-bold p-2 text-center backdrop-blur-sm">
                                Değiştirmek için tıkla
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Camera size={24} className="text-gray-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-400">Fotoğraf Seç</span>
                            <span className="text-[10px] text-gray-300">veya kamera ile çek</span>
                        </>
                    )}
                </div>
             </div>
    
             {/* Inputs */}
             <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Başlık</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Örn: Sony Kulaklık"
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                        required
                    />
                </div>
    
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Açıklama</label>
                    <textarea 
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="Ürünün durumu hakkında bilgi ver..."
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all h-32 resize-none"
                    />
                </div>
    
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">İstenen Yemek Kartı Bakiyesi (₺)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="0"
                            className="w-full p-4 pl-12 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-lg transition-all"
                            required
                        />
                        <Wallet size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
             </div>
    
             <div className="pt-4 pb-safe">
                 <Button fullWidth type="submit" disabled={isLoading} className="py-4">
                     {isLoading ? 'Kaydediliyor...' : 'İlanı Yayınla'}
                 </Button>
             </div>
          </form>
      </div>
    </div>
  );
};

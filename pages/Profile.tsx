import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Award, TrendingUp, Star, Camera, ShieldCheck, Heart, Zap, ChevronLeft, LogOut, Database, Wifi, Edit2, Check, X, Loader2 } from 'lucide-react';
import { ReferralService, DBService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(ReferralService.getUserProfile());
  const isConnected = isSupabaseConfigured();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLocation, setEditLocation] = useState(user.location);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUser = () => setUser(ReferralService.getUserProfile());
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const handleLogout = async () => {
    if (isConnected) {
        await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const handleEditToggle = () => {
    if (isEditing) {
        setIsEditing(false);
        setEditName(user.name);
        setEditLocation(user.location);
        setPreviewAvatar(null);
        setSelectedFile(null);
    } else {
        setEditName(user.name);
        setEditLocation(user.location);
        setIsEditing(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
            return;
        }
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewAvatar(objectUrl);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);

    try {
        let avatarUrl = user.avatar;
        if (selectedFile) {
            avatarUrl = await DBService.uploadAvatar(selectedFile);
        }

        await DBService.updateUserProfile(user.id, {
            name: editName,
            location: editLocation,
            avatar: avatarUrl
        });

        setUser(ReferralService.getUserProfile());
        setIsEditing(false);
        setPreviewAvatar(null);
        setSelectedFile(null);

    } catch (error: any) {
        alert("Profil güncellenirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 font-sans">
      <div className="bg-slate-900 text-white pt-10 pb-10 px-5 rounded-b-[1.5rem] shadow-sm relative z-20">
        <div className="relative z-30 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"><ChevronLeft size={16}/></button>
             <h1 className="text-sm font-bold tracking-wide">Profilim</h1>
           </div>
           
           <div className="flex gap-2">
               {isEditing ? (
                   <>
                     <button onClick={handleEditToggle} disabled={saving} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
                        <X size={14} />
                     </button>
                     <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors shadow-lg shadow-green-900/20">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                     </button>
                   </>
               ) : (
                   <>
                    <button onClick={handleEditToggle} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
                        <Edit2 size={14}/>
                    </button>
                    <button onClick={handleLogout} className="bg-white/10 hover:bg-red-500 hover:text-white text-gray-300 p-2 rounded-full transition-colors">
                        <LogOut size={14}/>
                    </button>
                   </>
               )}
           </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-30 space-y-3">
         <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="relative shrink-0">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
              />
              <div 
                className={`w-12 h-12 rounded-full bg-slate-100 p-0.5 overflow-hidden relative group ${isEditing ? 'cursor-pointer ring-2 ring-slate-900 ring-offset-2' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <img 
                    src={previewAvatar || user.avatar || "https://picsum.photos/100/100"} 
                    alt="Profile" 
                    className={`w-full h-full rounded-full object-cover transition-opacity ${isEditing ? 'group-hover:opacity-70' : ''}`} 
                />
                {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={16} className="text-white" />
                    </div>
                )}
              </div>
           </div>
           
           <div className="flex-1 min-w-0">
              {isEditing ? (
                  <div className="space-y-1">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-sm font-bold text-slate-800 border-b border-slate-900/30 focus:border-slate-900 outline-none bg-transparent px-1 py-0.5"
                        placeholder="Ad Soyad"
                      />
                      <input 
                        type="text" 
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full text-[10px] text-gray-500 border-b border-gray-200 focus:border-slate-900 outline-none bg-transparent px-1 py-0.5"
                        placeholder="Konum (Şehir)"
                      />
                  </div>
              ) : (
                  <>
                    <h2 className="text-sm font-bold text-slate-800">{user.name}</h2>
                    <div className="flex items-center gap-1 mt-0.5 text-gray-400 text-[10px]">
                        <MapPin size={10} /> {user.location}
                    </div>
                  </>
              )}
           </div>
         </div>

         <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-50">
            <StatItem icon={<Award size={14} className="text-emerald-600"/>} label="İşlem" value="0" color="bg-emerald-50" />
            <StatItem icon={<TrendingUp size={14} className="text-blue-600"/>} label="Kazanç" value={`₺${user.wallet.totalEarnings.toFixed(0)}`} color="bg-blue-50" onClick={() => navigate('/earnings')} />
            <StatItem icon={<Star size={14} className="text-yellow-500 fill-yellow-500"/>} label="Puan" value={user.rating.toString()} color="bg-yellow-50" />
         </div>

         <div>
            <h3 className="font-bold text-gray-800 text-[10px] mb-2 px-1">ROZETLERİM</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <Badge icon={<ShieldCheck size={12} />} color="bg-purple-50 text-purple-600 border-purple-100" label="Güvenilir" />
                <Badge icon={<Heart size={12} />} color="bg-pink-50 text-pink-600 border-pink-100" label="Yardımcı" />
                <Badge icon={<Zap size={12} />} color="bg-yellow-50 text-yellow-600 border-yellow-100" label="Hızlı" />
            </div>
         </div>

         <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <InfoRow icon={<User size={12} />} label="Ad Soyad" value={user.name} />
            <InfoRow icon={<Mail size={12} />} label="E-posta" value="Kullanıcı" />
         </div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, color, onClick }: any) => (
   <div className={`flex flex-col items-center gap-1 p-2 ${onClick ? 'cursor-pointer hover:bg-gray-50 rounded-lg' : ''}`} onClick={onClick}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div className="text-center">
         <span className="block font-black text-slate-800 text-xs">{value}</span>
         <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">{label}</span>
      </div>
   </div>
);

const Badge = ({ icon, color, label }: any) => (
   <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border ${color}`}>
      {icon} <span className="text-[9px] font-bold uppercase">{label}</span>
   </div>
);

const InfoRow = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
     <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">{icon}</div>
     <div className="flex-1 border-b border-gray-50 pb-1.5">
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-gray-700">{value}</p>
     </div>
  </div>
);
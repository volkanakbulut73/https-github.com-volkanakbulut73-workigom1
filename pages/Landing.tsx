
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users, QrCode, Repeat, Star, Lock } from 'lucide-react';
import { WebNavbar } from '../components/WebNavbar';
import { Footer } from '../components/Footer';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-[#0F172A] min-h-screen flex flex-col overflow-hidden">
        <WebNavbar isLanding={true} />
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="flex-1 flex items-center relative z-10 py-12 md:py-0">
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-full border border-white/10 shadow-xl mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-100 text-xs font-bold tracking-widest uppercase">P2P Yemek Kartı Paylaşım Ağı</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                Güvenli <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">QR Takas</span> <br />
                Mekanizması
              </h1>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-light">
                Yemek kartı kullanıcılarını ve restoran ödemesi yapanları buluşturan güvenli P2P platformu. Bakiyenizi iskontolu kullanım hakkı ile takaslayın, karşılıklı kazanın.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">Hemen Başla <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all backdrop-blur-md"
                >
                  Giriş Yap
                </button>
              </div>

              <div className="pt-6 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-400">
                 <div className="flex items-center gap-1">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Escrow Güvencesi</span>
                 </div>
                 <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                 <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    <span>Çift Taraflı Puanlama</span>
                 </div>
              </div>
            </div>

            {/* Right Visuals (Floating Cards) */}
            <div className="relative hidden lg:block h-[600px]">
               {/* Center Sphere */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>

               {/* Card 1: Supporter */}
               <div className="absolute top-10 right-10 z-20 animate-float">
                  <div className="bg-slate-800/80 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl w-64 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                     <div className="flex items-center gap-3 mb-3">
                        <img src="https://picsum.photos/100/100?random=1" className="w-10 h-10 rounded-full border-2 border-emerald-500" />
                        <div>
                           <p className="text-white font-bold text-sm">Zeynep K.</p>
                           <div className="flex gap-1 text-[10px] text-emerald-400">
                              <Star size={10} fill="currentColor" /> 4.9 Puan
                           </div>
                        </div>
                     </div>
                     <div className="bg-white/5 rounded-xl p-3 mb-2">
                        <p className="text-slate-400 text-xs">Yemek Kartı Bakiyesi</p>
                        <p className="text-white font-mono font-bold text-xl">₺1.200</p>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                        <QrCode size={14} /> Paylaşıma Hazır
                     </div>
                  </div>
               </div>

               {/* Card 2: Interaction */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="bg-white p-4 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-pulse-slow">
                     <Repeat size={32} className="text-emerald-600" />
                  </div>
               </div>

               {/* Card 3: Seeker */}
               <div className="absolute bottom-20 left-10 z-20 animate-float-delayed">
                  <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-2xl w-64 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                     <div className="flex items-center gap-3 mb-3">
                        <img src="https://picsum.photos/100/100?random=2" className="w-10 h-10 rounded-full border-2 border-slate-900" />
                        <div>
                           <p className="text-slate-900 font-bold text-sm">Ahmet Y.</p>
                           <div className="flex gap-1 text-[10px] text-yellow-500">
                              <ShieldCheck size={10} /> Onaylı Kullanıcı
                           </div>
                        </div>
                     </div>
                     <div className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                        <p className="text-gray-500 text-xs">Restoran Hesabı</p>
                        <p className="text-slate-900 font-mono font-bold text-xl">₺1.200</p>
                     </div>
                     <div className="flex items-center justify-between text-xs">
                         <span className="text-gray-500">Ödenecek Tutar:</span>
                         <span className="font-bold text-emerald-600">₺960 (Nakit)</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HOW IT WORKS (CONCEPT) --- */}
      <div className="py-24 bg-white relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <span className="text-emerald-600 font-bold tracking-widest uppercase text-xs mb-2 block">Ekosistem</span>
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Akıllı Takas Modeli</h2>
               <p className="text-lg text-gray-500 leading-relaxed">
                  Workigom, nakit akışını doğrudan yönetmez. Kullanıcıların güvenli bir ortamda "kullanım hakkı" takası yapmasını sağlar.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-500 to-emerald-100 border-t-2 border-dashed border-emerald-200 z-0"></div>

                <StepCard 
                   icon={<Users size={32} className="text-white" />}
                   title="1. Eşleşme"
                   desc="Restoranda hesap ödeyecek kişi ile yemek kartı bakiyesi olan kullanıcı platformda eşleşir."
                   color="bg-slate-900"
                />
                <StepCard 
                   icon={<QrCode size={32} className="text-white" />}
                   title="2. QR Takas"
                   desc="Kart sahibi, restoranın POS cihazındaki QR'ı okutarak hesabı öder. Bu işlem 'kullanım hakkı devri'dir."
                   color="bg-emerald-500"
                />
                <StepCard 
                   icon={<Lock size={32} className="text-white" />}
                   title="3. Escrow Transfer"
                   desc="Alıcı, indirimli tutarı Workigom havuzuna gönderir. İşlem onaylanınca bakiye satıcıya aktarılır."
                   color="bg-blue-600"
                />
            </div>
         </div>
      </div>

      {/* --- TRUST & FEATURES --- */}
      <div className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              
              <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
                     <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Topluluk Güveni</h3>
                           <p className="text-sm text-gray-500">Şeffaf ve puanlı sistem</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-full">
                           <Star className="text-yellow-500 fill-yellow-500" size={24} />
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <ReviewRow name="Caner E." rating={5} comment="Hızlı ve güvenli. QR anında çalıştı." time="2dk önce" />
                        <ReviewRow name="Selin A." rating={5} comment="Bakiyemi değerlendirmek için harika bir yol." time="15dk önce" />
                        <ReviewRow name="Mert K." rating={4.8} comment="Escrow sistemi sayesinde içim rahat." time="1s önce" />
                     </div>
                  </div>
              </div>

              <div className="space-y-8">
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                    Çift Taraflı <br />
                    <span className="text-emerald-600">Güvenlik Rozetleri</span>
                 </h2>
                 <p className="text-lg text-gray-600 leading-relaxed">
                    Her işlem sonrası hem destekçi hem de talep eden birbirini puanlar. Başarılı işlemler arttıkça "Altın Kalp" ve "Güvenilir Üye" rozetleri kazanırsınız.
                 </p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FeatureBox icon={<Lock size={20} />} title="Escrow (Emanet)" desc="Ödeme işlem bitene kadar havuzda bekler." />
                    <FeatureBox icon={<Zap size={20} />} title="Anlık Bildirim" desc="Her aşamada bilgilendirilirsiniz." />
                    <FeatureBox icon={<ShieldCheck size={20} />} title="Rozet Sistemi" desc="Güvenilir kullanıcılar öne çıkar." />
                    <FeatureBox icon={<Repeat size={20} />} title="Kolay İade" desc="Sorun anında para iadesi garantisi." />
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* --- CTA SECTION --- */}
      <div className="bg-slate-900 py-20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Dayanışma Ağına Katıl</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
               Yemek kartını özgürleştir veya yemeklerini daha uygun fiyata ye. Workigom ile herkes kazanır, israf önlenir.
            </p>
            <button 
               onClick={() => navigate('/register')}
               className="bg-white text-slate-900 px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
               Ücretsiz Hesap Oluştur
            </button>
            <p className="mt-6 text-slate-500 text-sm">Kredi kartı gerekmez • 7/24 Destek</p>
         </div>
      </div>

      <Footer />
    </div>
  );
};

const StepCard = ({icon, title, desc, color}: any) => (
   <div className="relative z-10 flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow group">
      <div className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300`}>
         {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
   </div>
);

const ReviewRow = ({name, rating, comment, time}: any) => (
   <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
         {name.charAt(0)}
      </div>
      <div className="flex-1">
         <div className="flex justify-between items-center mb-0.5">
            <p className="text-xs font-bold text-slate-900">{name}</p>
            <span className="text-[10px] text-gray-400">{time}</span>
         </div>
         <div className="flex text-yellow-400 mb-1">
            {[...Array(5)].map((_, i) => (
               <Star key={i} size={8} fill={i < Math.floor(rating) ? "currentColor" : "none"} />
            ))}
         </div>
         <p className="text-xs text-gray-600">{comment}</p>
      </div>
   </div>
);

const FeatureBox = ({icon, title, desc}: any) => (
   <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors">
      <div className="text-emerald-500 mt-0.5">{icon}</div>
      <div>
         <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
         <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
   </div>
);

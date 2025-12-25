
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users, QrCode, Repeat, Star, Lock, Wallet, ChevronRight } from 'lucide-react';
import { WebNavbar } from '../components/WebNavbar';
import { Footer } from '../components/Footer';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-[#0F172A] min-h-screen flex flex-col overflow-hidden">
        <WebNavbar isLanding={true} />
        
        {/* Hareketli Arka Plan Efektleri */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob"></div>
          <div className="absolute top-20 -right-4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="flex-1 flex items-center relative z-10 pt-32 pb-20 md:pt-0 md:pb-0">
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Sol İçerik */}
            <div className="space-y-8 animate-fade-in text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                </span>
                <span className="text-emerald-100 text-[10px] font-black tracking-[0.2em] uppercase">Yeni Nesil Takas Ekonomisi</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mt-4">
                Yemek Çekini <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-cyan-400">Özgürleştir.</span>
              </h1>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium opacity-80">
                Kullanmadığın yemek kartı bakiyelerini toplulukla paylaş, nakit kazan veya indirimli yemek yeme fırsatını yakala. %100 güvenli, P2P takas platformu.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 group active:scale-95"
                >
                  Hemen Katıl <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-5 rounded-2xl font-bold text-lg transition-all backdrop-blur-md active:scale-95"
                >
                  Giriş Yap
                </button>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                 <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>Escrow Koruması</span>
                 </div>
                 <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                 <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <span>Onaylı Üyeler</span>
                 </div>
              </div>
            </div>

            {/* Sağ Görsel Area */}
            <div className="relative hidden lg:block h-[650px]">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
               
               {/* Floating Card 1 */}
               <div className="absolute top-0 right-0 z-20 animate-float">
                  <div className="bg-slate-800/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl w-72 transform rotate-6">
                     <div className="flex items-center gap-4 mb-5">
                        <img src="https://picsum.photos/100/100?random=11" className="w-12 h-12 rounded-full border-2 border-emerald-500 p-0.5" />
                        <div>
                           <p className="text-white font-black text-sm">Deniz Aras</p>
                           <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Sodexo Paylaşımcı</p>
                        </div>
                     </div>
                     <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Mevcut Bakiye</p>
                        <p className="text-white font-black text-2xl">₺2.450,00</p>
                     </div>
                     <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-tighter">
                        <Zap size={14} className="fill-emerald-400" /> %20 İskontolu Paylaşım
                     </div>
                  </div>
               </div>

               {/* Floating Card 2 */}
               <div className="absolute bottom-10 left-0 z-30 animate-float-delayed">
                  <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-2xl w-72 transform -rotate-3">
                     <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black">M.</div>
                        <div>
                           <p className="text-slate-900 font-black text-sm">Murat T.</p>
                           <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Talep Sahibi</p>
                        </div>
                     </div>
                     <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
                        <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Hesap Tutarı</p>
                        <p className="text-slate-900 font-black text-2xl">₺1.000,00</p>
                     </div>
                     <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Kazanç:</span>
                         <span className="text-sm font-black text-emerald-600">₺200 TASARRUF</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- NASIL ÇALIŞIR --- */}
      <div className="py-32 bg-white">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-24">
               <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Basit, Hızlı ve Güvenli.</h2>
               <p className="text-gray-500 text-lg font-medium leading-relaxed">
                  Workigom, nakit akışını yönetmez; kullanıcılar arası "kullanım hakkı" transferini güvenli bir protokolle denetler.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <LandingStep 
                  number="01" 
                  title="Talebi Oluştur" 
                  desc="Restoranda ödeme yapacağınız tutarı girin ve bir destekçiyle anında eşleşin." 
                  icon={<Users className="text-emerald-500" size={32} />}
               />
               <LandingStep 
                  number="02" 
                  title="QR Kodunu Okut" 
                  desc="Destekçinin sizinle paylaştığı yemek kartı QR kodunu kasada saniyeler içinde okutun." 
                  icon={<QrCode className="text-blue-500" size={32} />}
               />
               <LandingStep 
                  number="03" 
                  title="Onayla ve Bitir" 
                  desc="Ödeme tamamlandığında sistem üzerinden onay verin, indirimli tutar cüzdandan aktarılsın." 
                  icon={<CheckCircle className="text-purple-500" size={32} />}
               />
            </div>
         </div>
      </div>

      {/* --- CTA --- */}
      <div className="bg-slate-900 py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Dayanışmaya bugün başlayın.</h2>
            <p className="text-slate-400 text-xl mb-12 font-medium opacity-80">
               Binlerce Workigom üyesi her gün yemek kartı bakiyelerini paylaşıyor ve birlikte kazanıyor.
            </p>
            <button 
               onClick={() => navigate('/register')}
               className="bg-white text-slate-950 px-12 py-6 rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-transform shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
               Ücretsiz Kayıt Ol
            </button>
         </div>
      </div>

      <Footer />
    </div>
  );
};

const LandingStep = ({number, title, desc, icon}: any) => (
  <div className="group p-10 rounded-[3rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
     <div className="mb-8 flex justify-between items-start">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
           {icon}
        </div>
        <span className="text-4xl font-black text-gray-200 group-hover:text-emerald-500/20 transition-colors">{number}</span>
     </div>
     <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
     <p className="text-gray-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const CheckCircle = ({className, size}: any) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
   </svg>
);

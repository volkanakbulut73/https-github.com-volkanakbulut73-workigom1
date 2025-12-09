import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Percent, Users } from 'lucide-react';
import { WebNavbar } from '../components/WebNavbar';
import { Footer } from '../components/Footer';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-slate-900 min-h-[90vh] flex flex-col">
        <WebNavbar isLanding={true} />
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        </div>

        <div className="flex-1 flex items-center relative z-10">
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-100 text-xs font-bold tracking-wide uppercase">Şimdi Yayında</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
                Yemek Kartını <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Paylaş</span>
              </h1>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-lg">
                Kullanmadığın yemek kartı bakiyelerini toplulukla paylaş veya %20'ye varan indirimlerle yemek ye. Güvenli, hızlı ve kolay.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                >
                  Hemen Başla <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all backdrop-blur-sm"
                >
                  Giriş Yap
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-400 pt-8">
                <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                       <img src={`https://picsum.photos/100/100?random=${i}`} alt="user" />
                     </div>
                   ))}
                </div>
                <p>10.000+ Mutlu Kullanıcı</p>
              </div>
            </div>

            <div className="hidden md:block relative animate-fade-in delay-100">
              <div className="relative z-10 transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl">
                     {/* Mock UI Card */}
                     <div className="bg-white rounded-[2rem] p-6 shadow-lg mb-4">
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100">
                                 <img src="https://picsum.photos/200" className="w-full h-full rounded-full object-cover" />
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-900">Ahmet Y.</h3>
                                 <p className="text-xs text-gray-500">Multinet • İstanbul</p>
                              </div>
                           </div>
                           <span className="font-black text-xl text-emerald-600">₺800</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full w-full mb-4 overflow-hidden">
                           <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                           <span>Onaylandı</span>
                           <span>İşlem Bekleniyor</span>
                        </div>
                     </div>
                     
                     <div className="bg-slate-800 rounded-[2rem] p-6 shadow-lg text-white">
                        <div className="flex justify-between items-center">
                            <div>
                               <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Toplam Tasarruf</p>
                               <h3 className="text-3xl font-black">₺1,250.00</h3>
                            </div>
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                               <Percent size={24} />
                            </div>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="nasil-calisir" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Nasıl Çalışır?</h2>
              <p className="text-gray-500 text-lg">İster yemeğini ucuza ye, ister kartını paylaşarak değerlendir. Workigom ile herkes kazanır.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                 icon={<ShieldCheck size={32} className="text-emerald-500" />}
                 title="Güvenli Eşleşme"
                 desc="QR kod ve konum bazlı doğrulama sistemi ile tüm işlemler güvende."
              />
              <FeatureCard 
                 icon={<Zap size={32} className="text-yellow-500" />}
                 title="Hızlı İşlem"
                 desc="Restoran kasasında veya online olarak saniyeler içinde paylaşım yap."
              />
              <FeatureCard 
                 icon={<Users size={32} className="text-indigo-500" />}
                 title="Geniş Topluluk"
                 desc="Binlerce öğrenci ve çalışan bu platformda yardımlaşıyor."
              />
           </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const FeatureCard = ({icon, title, desc}: any) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
     <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
        {icon}
     </div>
     <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
     <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);
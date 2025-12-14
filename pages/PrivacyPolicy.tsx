import React, { useEffect } from 'react';
import { WebNavbar } from '../components/WebNavbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicy: React.FC = () => {
  
  // Sayfa açıldığında en üste kaydır
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      <WebNavbar isLanding={false} />

      <main className="flex-grow pt-10 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 border-b border-gray-100 pb-4">
            Gizlilik Politikası
          </h1>

          <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed space-y-6">
            <p>
              Bu İnternet sitesini kullanarak kişisel verilerinizin işlenmesini kabul etmiş olursunuz. Güvenliğiniz bizim için önemli. Bu sebeple, bizimle paylaşacağınız kişisel verileriniz hassasiyetle korunmaktadır.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Veri Sorumlusu</h2>
            <p>
              Biz, workigom.com, veri sorumlusu olarak, bu gizlilik ve kişisel verilerin korunması politikası ile ziyaret etmekte olduğunuz İnternet sitesi kapsamında hangi kişisel verilerinizin hangi amaçlarla işleneceği, işlenen verilerin kimlerle ve hangi sebeplerle paylaşılabileceği, veri işleme yöntemimiz ve hukuki sebepleri ile; işlenen verilerinize ilişkin haklarınızın neler olduğu hususunda siz kullanıcılarımızı aydınlatmayı amaçlıyoruz.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Toplanan Kişisel Veriler</h2>
            <p>Bu İnternet sitesi tarafından toplanan kişisel verileriniz:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Adres bilgileri</li>
              <li>Cihaz bilgileri</li>
              <li>E-posta adresi</li>
              <li>IP adresi</li>
              <li>Ad ve soyad</li>
              <li>Ödeme bilgileri</li>
              <li>Telefon numarası</li>
              <li>Sosyal medya profil bilgileri</li>
              <li>Kullanım verileri</li>
              <li>Konum bilgileri</li>
              <li>Finansal veriler</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Kullanılan Servisler</h2>
            
            <h3 className="font-bold text-slate-700 mt-4">Analitik ve izleme</h3>
            <p><strong>Google Analytics:</strong> Google Analytics, ziyaretçi davranışlarını ve site kullanımını analiz etmek için kullanılmaktadır. Bu hizmet, ziyaretçi trafiği, etkileşimler ve kullanıcı davranışları hakkında detaylı raporlar sağlar.</p>

            <h3 className="font-bold text-slate-700 mt-4">Ödeme sistemleri</h3>
            <p><strong>PayTR:</strong> PayTR, ödeme altyapısı sunar.</p>

            <h3 className="font-bold text-slate-700 mt-4">Sosyal medya</h3>
            <p><strong>Google ile giriş:</strong> Google ile Giriş özelliği, güvenli kimlik doğrulama için kullanılmaktadır. E-posta ve temel profil bilgileriniz alınır.</p>

            <h3 className="font-bold text-slate-700 mt-4">Yayıncılık hizmetleri</h3>
            <p>
              <strong>Google AdSense:</strong> Google AdSense, İnternet sitelerinde reklam göstermek için kullanılan bir araçtır. Google dahil üçüncü taraflar, kullanıcıların bu veya başka bir web sitesine daha önce yapmış olduğu ziyaretlere dayalı olarak reklam sunabilmek için çerezleri kullanır. Kişiselleştirilmiş reklamları, <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">https://www.google.com/settings/ads</a> adresinden devre dışı bırakabilirsiniz.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Verilerin İşlenme Amaçları</h2>
            <p>
              Kişisel verileriniz, bu İnternet sitesi tarafından amacına uygun hizmet sunulabilmesi, yasal yükümlülüklerin yerine getirilmesi, hizmet kalitesinin artırılması, iletişim, güvenlik ve gerektiğinde yasal merciler ile bilgi paylaşılabilmesi amaçları ile işlenmektedir. Kişisel verileriniz, bu sayılan amaçlar dışında kullanılmayacaktır.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Verilerin Aktarılması</h2>
            <p>
              Bu İnternet sitesi tarafından toplanan kişisel verileriniz, yasal zorunluluklar haricinde, açık rızanız olmadan üçüncü kişiler ile paylaşılmaz. Ancak hizmet sağlayıcılarımız, iş ortaklarımız ve yasal merciler ile, hizmetin sağlanması ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla gerekli olduğu ölçüde paylaşılabilir.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Çerez Kullanımı</h2>
            <p>
              Bu İnternet sitesi çerez kullanmaktadır. Çerezler, bir İnternet sayfası ziyaret edildiğinde kullanıcılara ilişkin birtakım bilgilerin kullanıcıların terminal cihazlarında depolanmasına izin veren düşük boyutlu zengin metin biçimli text formatlarıdır. Çerezler, bir İnternet sitesini ilk ziyaretiniz sırasında tarayıcınız aracılığıyla cihazınıza depolanabilir ve aynı siteyi aynı cihazla tekrar ziyaret ettiğinizde, tarayıcınız cihazınızda site adına kayıtlı bir çerez olup olmadığını kontrol eder. Eğer kayıt var ise, kaydın içindeki veriyi ziyaret etmekte olduğunuz İnternet sitesine iletir. Bu sayede İnternet sitesi, sizin daha önceki ziyaretinizi tespit eder ve size iletilecek içeriği ona göre belirler.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Yasal Haklarınız (KVKK Kapsamında Haklarınız)</h2>
            <p>6698 sayılı KVKK madde 11 uyarınca herkes, veri sorumlusuna başvurarak kendisiyle ilgili aşağıda yer alan taleplerde bulunma hakkına sahiptir:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Kişisel verilerinin işlenip işlenmediğini öğrenme.</li>
              <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme.</li>
              <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme.</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme.</li>
              <li>KVKK madde 7 ile öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme.</li>
              <li>Düzeltme, silme ve yok edilme talepleri neticesinde yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme.</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">İletişim</h2>
            <p>
              Kişisel verilerinizle ilgili haklarınızı kullanmak veya Gizlilik Politika'mız hakkında daha fazla bilgi almak için <a href="mailto:volkanbulut73@gmail.com" className="text-emerald-600 hover:underline font-bold">volkanbulut73@gmail.com</a> adresinden bizimle iletişime geçebilirsiniz.
            </p>

            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-2">Onay ve Yürürlük</h2>
            <p>
              İnternet sitemiz ile kişisel verilerinizi paylaşmak, tamamen sizin tercihinizdir. İnternet sitemizi kullanmaya devam ettiğiniz takdirde, bu Gizlilik Politikası'nı kabul ettiğiniz varsayılacaktır. Bu politika, 14 Aralık 2025 tarihinde yürürlüğe girmiş olup, gerektiğinde güncellenir.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
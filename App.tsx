
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { WebNavbar } from './components/WebNavbar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { FindShare } from './pages/FindShare';
import { Supporters } from './pages/Supporters';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { ChatRooms } from './pages/ChatRooms'; // Import New Page
import { SwapList } from './pages/SwapList';
import { SwapCreate } from './pages/SwapCreate';
import { SwapDetail } from './pages/SwapDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Invite } from './pages/Invite';
import { Earnings } from './pages/Earnings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ReferralService, DBService, User } from './types'; 
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Main Dashboard Layout (3-Column) with Auth Check
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. Önce LocalStorage kontrolü (Hız için)
      const localUser = ReferralService.getUserProfile();
      if (localUser.id !== 'current-user') {
          if (mounted) {
            setIsAuthenticated(true);
            setIsLoading(false);
          }
          return;
      }

      // 2. Supabase Oturum Kontrolü
      if (isSupabaseConfigured()) {
          // Google Login sonrası URL'de hash var mı? Varsa Supabase'in işlemesini bekle.
          // Bu kontrol "Redirect Loop" sorununu önler.
          const isOAuthRedirect = window.location.hash && window.location.hash.includes('access_token');
          
          if (isOAuthRedirect) {
              // Yükleniyor durumunda kal, onAuthStateChange olayı (SIGNED_IN) birazdan tetiklenecek.
              return;
          }

          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
             await handleUserSession(session.user);
          } else {
             // Oturum yok ve OAuth redirect değilse, giriş sayfasına at.
             if (mounted) {
                 setIsAuthenticated(false);
                 setIsLoading(false);
             }
          }
      } else {
          // Supabase yoksa ve local user yoksa (Demo dışı)
          if (mounted) {
             setIsAuthenticated(false);
             setIsLoading(false);
          }
      }
    };

    const handleUserSession = async (user: any) => {
        try {
            const profile = await DBService.getUserProfile(user.id);
            if (profile) {
                ReferralService.saveUserProfile(profile);
                if (mounted) setIsAuthenticated(true);
            } else {
                // Yeni Google kullanıcısı veya SQL Trigger hatası durumunda profil oluştur
                const newProfile: User = {
                    id: user.id,
                    name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Yeni Kullanıcı',
                    avatar: user.user_metadata.avatar_url || 'https://picsum.photos/200',
                    rating: 5.0,
                    location: 'İstanbul',
                    goldenHearts: 0,
                    silverHearts: 0,
                    isAvailable: true,
                    referralCode: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    wallet: { balance: 0, totalEarnings: 0, pendingBalance: 0 }
                };

                // Eğer Supabase bağlıysa, profili veritabanına da yazmayı dene (Self-healing)
                if (isSupabaseConfigured()) {
                   try {
                     await supabase.from('profiles').insert({
                       id: user.id,
                       full_name: newProfile.name,
                       avatar_url: newProfile.avatar,
                       rating: newProfile.rating,
                       location: newProfile.location,
                       golden_hearts: newProfile.goldenHearts,
                       silver_hearts: newProfile.silverHearts,
                       referral_code: newProfile.referralCode,
                       wallet_balance: newProfile.wallet.balance,
                       total_earnings: newProfile.wallet.totalEarnings
                     });
                   } catch (insertError) {
                     // Hata genellikle profil zaten varsa (Trigger çalıştıysa) oluşur, yoksayabiliriz.
                     console.warn("Auto-create profile info:", insertError);
                   }
                }

                ReferralService.saveUserProfile(newProfile);
                if (mounted) setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Profile load error", e);
            if (mounted) setIsAuthenticated(false);
        } finally {
            if (mounted) setIsLoading(false);
        }
    };

    // Oturum değişikliklerini (OAuth Login dahil) dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            await handleUserSession(session.user);
        } else if (event === 'SIGNED_OUT') {
            if (mounted) setIsAuthenticated(false);
        }
    });

    initializeAuth();

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-slate-900" size={32} />
                <p className="text-sm font-bold text-gray-500">Oturum açılıyor...</p>
            </div>
        </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Left Sidebar (Desktop only) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden">
           <WebNavbar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-0 md:p-6 lg:p-8">
           {children}
        </main>
        
        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>

      {/* Right Sidebar (Desktop only - Widgets) */}
      <RightSidebar />
    </div>
  );
};

// Simple wrapper for Auth pages
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <WebNavbar />
      {children}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      
      {/* App Routes */}
      <Route path="/app" element={<DashboardLayout><Home /></DashboardLayout>} />
      <Route path="/find-share" element={<DashboardLayout><FindShare /></DashboardLayout>} />
      <Route path="/supporters" element={<DashboardLayout><Supporters /></DashboardLayout>} />
      <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
      
      {/* Chat Routes - Handled inside Messages for Split View */}
      <Route path="/messages" element={<DashboardLayout><Messages /></DashboardLayout>} />
      <Route path="/messages/:userId" element={<DashboardLayout><Messages /></DashboardLayout>} />

      {/* New Chat Rooms Routes */}
      <Route path="/chatrooms" element={<DashboardLayout><ChatRooms /></DashboardLayout>} />
      <Route path="/chatrooms/:channelId" element={<DashboardLayout><ChatRooms /></DashboardLayout>} />
      
      <Route path="/swap" element={<DashboardLayout><SwapList /></DashboardLayout>} />
      <Route path="/swap/create" element={<DashboardLayout><SwapCreate /></DashboardLayout>} />
      <Route path="/swap/:id" element={<DashboardLayout><SwapDetail /></DashboardLayout>} />
      <Route path="/invite" element={<DashboardLayout><Invite /></DashboardLayout>} />
      <Route path="/earnings" element={<DashboardLayout><Earnings /></DashboardLayout>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { WebNavbar } from './components/WebNavbar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { FindShare } from './pages/FindShare';
import { Supporters } from './pages/Supporters';
import { Profile } from './pages/Profile';
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

const DashboardLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        const user = session.user;
        const profile = await DBService.getUserProfile(user.id);
        
        if (mounted) {
          if (profile) {
            ReferralService.saveUserProfile(profile);
          } else {
            // Profil yoksa geçici oluştur
            const temp: User = {
              id: user.id,
              name: user.user_metadata?.full_name || 'Kullanıcı',
              avatar: user.user_metadata?.avatar_url || 'https://picsum.photos/200',
              rating: 5, location: 'İstanbul', goldenHearts: 0, silverHearts: 0,
              isAvailable: true, referralCode: 'REF',
              wallet: { balance: 0, totalEarnings: 0, pendingBalance: 0 }
            };
            ReferralService.saveUserProfile(temp);
          }
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Auth process failed:", e);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bağlantı Kuruluyor...</p>
      </div>
    );
  }

  if (isAuthenticated === false) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden"><WebNavbar /></div>
        <main className="flex-1 w-full max-w-5xl mx-auto p-0 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <div className="hidden lg:block">
        <RightSidebar />
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Herkese Açık Sayfalar */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    
    {/* Korumalı Dashboard Sayfaları (Persistent Layout) */}
    <Route element={<DashboardLayout />}>
      <Route path="/app" element={<Home />} />
      <Route path="/find-share" element={<FindShare />} />
      <Route path="/supporters" element={<Supporters />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/swap" element={<SwapList />} />
      <Route path="/swap/create" element={<SwapCreate />} />
      <Route path="/swap/:id" element={<SwapDetail />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/earnings" element={<Earnings />} />
    </Route>
    
    {/* Tanımsız Rotalar için Yönlendirme */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
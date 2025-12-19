
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { Chat } from './pages/Chat';
import { ReferralService, DBService, User } from './types'; 
import { supabase, isSupabaseConfigured } from './lib/supabase';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden"><WebNavbar /></div>
        <main className="flex-1 w-full max-w-5xl mx-auto p-0 md:p-6 lg:p-8">
          {children}
        </main>
        <BottomNav />
      </div>
      <RightSidebar />
    </div>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/app" element={<DashboardLayout><Home /></DashboardLayout>} />
    <Route path="/find-share" element={<DashboardLayout><FindShare /></DashboardLayout>} />
    <Route path="/supporters" element={<DashboardLayout><Supporters /></DashboardLayout>} />
    <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
    <Route path="/swap" element={<DashboardLayout><SwapList /></DashboardLayout>} />
    <Route path="/chat" element={<DashboardLayout><Chat /></DashboardLayout>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}


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
import { Loader2 } from 'lucide-react';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: any = null;

    const handleUserSession = async (user: any) => {
        if (!user || !mounted) return;
        
        const tempUser: User = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
            avatar: user.user_metadata?.avatar_url || 'https://picsum.photos/200',
            rating: 5.0,
            location: 'İstanbul',
            goldenHearts: 0,
            silverHearts: 0,
            isAvailable: true,
            referralCode: '...', 
            wallet: { balance: 0, totalEarnings: 0, pendingBalance: 0 }
        };
        
        ReferralService.saveUserProfile(tempUser);

        setIsAuthenticated(true);
        setIsLoading(false);
        if (safetyTimer) clearTimeout(safetyTimer);

        try {
            const profile = await DBService.getUserProfile(user.id);
            if (profile && mounted) {
                ReferralService.saveUserProfile(profile);
            } else if (mounted) {
                 const newProfile = { 
                     ...tempUser, 
                     referralCode: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase() 
                 };
                 await DBService.upsertProfile(newProfile);
                 ReferralService.saveUserProfile(newProfile);
            }
        } catch (e) {
            console.error("Profile sync error", e);
        }
    };

    const initialize = async () => {
        if (!mounted) return;

        // 1. Optimistic Check: Sadece GERÇEK bir kullanıcı varsa direkt aç
        const localUser = ReferralService.getUserProfile();
        const hasRealUser = localUser && localUser.id && localUser.id !== 'guest' && localUser.id !== 'current-user';
        
        if (hasRealUser) {
            setIsAuthenticated(true);
            setIsLoading(false);
        }

        if (!isSupabaseConfigured()) {
            setIsLoading(false);
            return;
        }

        // 2. Safety Timer: Ağ isteği çok uzarsa pes et (Süreyi 6sn'ye düşürdük)
        safetyTimer = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn("Auth check timed out - forcing local state.");
                setIsLoading(false);
                const forcedUser = ReferralService.getUserProfile();
                setIsAuthenticated(!!(forcedUser && forcedUser.id && forcedUser.id !== 'guest'));
            }
        }, 6000);

        try {
            // getSession'ı bir timeout ile yarıştıralım
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
            
            const result = (await Promise.race([sessionPromise, timeoutPromise])) as any;
            const session = result.data?.session;

            if (session?.user) {
                await handleUserSession(session.user);
            } else {
                if (mounted && !hasRealUser) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    if (safetyTimer) clearTimeout(safetyTimer);
                }
            }
        } catch (e) {
            console.warn("Auth initialization error or timeout", e);
            if (mounted && !hasRealUser) {
                setIsLoading(false);
                if (safetyTimer) clearTimeout(safetyTimer);
            }
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user) {
                await handleUserSession(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setIsLoading(false);
            ReferralService.logout();
            if (safetyTimer) clearTimeout(safetyTimer);
        }
    });

    initialize();

    return () => {
        mounted = false;
        if (safetyTimer) clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Yükleniyor...</p>
            </div>
        </div>
      );
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
           <WebNavbar />
        </div>
        <main className="flex-1 w-full max-w-5xl mx-auto p-0 md:p-6 lg:p-8">
           {children}
        </main>
        <BottomNav />
      </div>
      <RightSidebar />
    </div>
  );
};

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
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      
      {/* Protected Routes */}
      <Route path="/app" element={<DashboardLayout><Home /></DashboardLayout>} />
      <Route path="/find-share" element={<DashboardLayout><FindShare /></DashboardLayout>} />
      <Route path="/supporters" element={<DashboardLayout><Supporters /></DashboardLayout>} />
      <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
      
      <Route path="/swap" element={<DashboardLayout><SwapList /></DashboardLayout>} />
      <Route path="/swap/create" element={<DashboardLayout><SwapCreate /></DashboardLayout>} />
      <Route path="/swap/:id" element={<DashboardLayout><SwapDetail /></DashboardLayout>} />
      
      <Route path="/invite" element={<DashboardLayout><Invite /></DashboardLayout>} />
      <Route path="/earnings" element={<DashboardLayout><Earnings /></DashboardLayout>} />
      
      <Route path="/chat" element={<DashboardLayout><Chat /></DashboardLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;

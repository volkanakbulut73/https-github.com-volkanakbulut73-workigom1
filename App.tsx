
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

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout: If auth check hangs for 4s, force stop loading.
    const safetyTimer = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Auth check timed out - forcing state.");
            setIsLoading(false);
            const localUser = ReferralService.getUserProfile();
            setIsAuthenticated(localUser.id !== 'current-user');
        }
    }, 4000);

    const initializeAuth = async () => {
      // 1. Optimistic Check: Local Storage
      const isOAuthRedirect = window.location.hash && window.location.hash.includes('access_token');
      const localUser = ReferralService.getUserProfile();
      
      if (!isOAuthRedirect && localUser.id !== 'current-user') {
          if (mounted) {
              setIsAuthenticated(true);
              setIsLoading(false);
          }
      }

      // 2. Supabase Check
      if (isSupabaseConfigured()) {
          try {
              const { data: { session }, error } = await supabase.auth.getSession();

              if (session?.user) {
                 await handleUserSession(session.user);
              } else {
                 if (!isOAuthRedirect) {
                     if (mounted) { setIsAuthenticated(false); setIsLoading(false); }
                 }
              }
          } catch (error) {
              console.warn("Auth check failed:", error);
              if (mounted) { setIsAuthenticated(false); setIsLoading(false); }
          }
      } else {
          if (mounted) { setIsAuthenticated(false); setIsLoading(false); }
      }
    };

    const handleUserSession = async (user: any) => {
        // 1. Construct temporary profile from Auth User Data (available immediately)
        // This ensures the user sees their name/avatar instantly without waiting for DB
        const tempUser: User = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
            avatar: user.user_metadata?.avatar_url || 'https://picsum.photos/200',
            rating: 5.0,
            location: 'İstanbul',
            goldenHearts: 0,
            silverHearts: 0,
            isAvailable: true,
            referralCode: 'YUKLENIYOR', 
            wallet: { balance: 0, totalEarnings: 0, pendingBalance: 0 }
        };
        
        // Save temp profile to unblock UI with valid-looking data
        ReferralService.saveUserProfile(tempUser);

        // 2. Immediate UI unlock - Do not wait for DB
        if (mounted) {
            setIsAuthenticated(true);
            setIsLoading(false);
        }

        // 3. Background Fetch from DB for Wallet/Real Data
        try {
            const profile = await DBService.getUserProfile(user.id);
            if (profile) {
                ReferralService.saveUserProfile(profile);
            } else {
                 // First time user? Upsert default profile
                 const newProfile = { 
                     ...tempUser, 
                     referralCode: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase() 
                 };
                 await DBService.upsertProfile(newProfile);
                 ReferralService.saveUserProfile(newProfile);
            }
        } catch (e) {
            console.error("Profile background sync error", e);
        } finally {
            clearTimeout(safetyTimer);
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user) {
                await handleUserSession(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            if (mounted) {
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        }
    });

    initializeAuth();

    return () => {
        mounted = false;
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-slate-900" size={32} />
                <p className="text-sm font-bold text-gray-500">Workigom Başlatılıyor...</p>
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

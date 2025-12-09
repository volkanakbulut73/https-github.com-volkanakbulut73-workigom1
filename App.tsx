import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { SwapList } from './pages/SwapList';
import { SwapCreate } from './pages/SwapCreate';
import { SwapDetail } from './pages/SwapDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Invite } from './pages/Invite';
import { Earnings } from './pages/Earnings';

// Main Dashboard Layout (3-Column)
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
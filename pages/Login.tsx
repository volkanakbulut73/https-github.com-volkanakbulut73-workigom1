import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, ReferralService } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
       await new Promise(r => setTimeout(r, 1000));
       
       const mockUser: User = {
          id: 'mock-user-demo',
          name: 'Demo Kullanıcı',
          avatar: 'https://picsum.photos/200',
          rating: 4.9,
          location: 'İstanbul',
          goldenHearts: 12,
          silverHearts: 3,
          isAvailable: true,
          referralCode: 'DEMO123',
          wallet: {
            balance: 250.00,
            totalEarnings: 850.00,
            pendingBalance: 0
          }
       };

       ReferralService.saveUserProfile(mockUser);
       navigate('/app'); // Changed from '/' to '/app'
       setIsLoading(false);
       return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const appUser: User = {
          id: authData.user.id,
          name: profile?.full_name || email.split('@')[0],
          avatar: profile?.avatar_url || 'https://picsum.photos/200',
          rating: parseFloat(profile?.rating || '5.0'),
          location: profile?.location || 'Konum Belirtilmedi',
          goldenHearts: profile?.golden_hearts || 0,
          silverHearts: profile?.silver_hearts || 0,
          isAvailable: true,
          referralCode: profile?.referral_code || 'REFNEW',
          wallet: {
            balance: parseFloat(profile?.wallet_balance || '0'),
            totalEarnings: parseFloat(profile?.total_earnings || '0'),
            pendingBalance: 0
          }
        };

        ReferralService.saveUserProfile(appUser);
        navigate('/app'); // Changed from '/' to '/app'
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Giriş başarısız. Bilgilerinizi kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[3rem] z-0"></div>

      <div className="relative z-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 mt-10 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Workigom</h1>
          <p className="text-gray-500 text-sm mt-1">Yemek paylaşım platformuna hoş geldin</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-gray-400 ml-1">E-POSTA</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                type="email"
                name="email"
                id="email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-medium text-gray-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-bold text-gray-400 ml-1">ŞİFRE</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                name="password"
                id="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-medium text-gray-700"
                required
              />
            </div>
          </div>

          <Button fullWidth type="submit" disabled={isLoading} className="mt-4 group">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Giriş Yapılıyor...</span>
            ) : (
              <span className="flex items-center gap-2">Giriş Yap <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Hesabın yok mu? <Link to="/register" className="text-slate-900 font-bold hover:underline">Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
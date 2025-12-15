
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) throw authError;

      if (data.user) {
        alert("Kayıt başarılı! Giriş yapabilirsiniz.");
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/app`,
            },
        });
        if (error) throw error;
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Google ile kayıt başarısız.");
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[3rem] z-0"></div>

      <div className="relative z-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 mt-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-900">
            <UserIcon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kayıt Ol</h1>
          <p className="text-gray-500 text-sm mt-1">Workigom ailesine katıl</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 ml-1">AD SOYAD</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <UserIcon size={18} />
              </div>
              <input 
                type="text" 
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Adın Soyadın"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-medium text-gray-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 ml-1">E-POSTA</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-medium text-gray-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 ml-1">ŞİFRE</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all font-medium text-gray-700"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button fullWidth type="submit" disabled={isLoading || isGoogleLoading} className="mt-4">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Kayıt Yapılıyor...</span>
            ) : (
              <span className="flex items-center gap-2">Hesap Oluştur <ArrowRight size={16} /></span>
            )}
          </Button>
        </form>

        <div className="grid gap-3 mt-4">
            <button 
                type="button"
                onClick={handleGoogleRegister}
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98] text-sm"
            >
                {isGoogleLoading ? (
                    <Loader2 size={20} className="animate-spin text-slate-600" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google ile Kayıt Ol
                    </>
                )}
            </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Zaten hesabın var mı? <Link to="/login" className="text-slate-900 font-bold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

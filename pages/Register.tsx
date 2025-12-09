import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
       await new Promise(r => setTimeout(r, 1000));
       alert("Demo modunda kayıt işlemi simüle edildi. Şimdi giriş yapabilirsiniz.");
       navigate('/login');
       setIsLoading(false);
       return;
    }

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

          <Button fullWidth type="submit" disabled={isLoading} className="mt-4">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Kayıt Yapılıyor...</span>
            ) : (
              <span className="flex items-center gap-2">Hesap Oluştur <ArrowRight size={16} /></span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Zaten hesabın var mı? <Link to="/login" className="text-slate-900 font-bold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
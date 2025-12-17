

// ... existing imports
import { supabase, isSupabaseConfigured } from './lib/supabase';

export enum VoucherCompany {
  SODEXO = 'Sodexo',
  MULTINET = 'Multinet',
  TICKET = 'Ticket Edenred',
  SETCARD = 'Setcard',
  METROPOL = 'Metropol',
  OTHER = 'Diğer'
}

export interface Voucher {
  id: string;
  company: VoucherCompany;
  amount: number;
  price: number;
  expiryDate: string;
  location: string;
  sellerName: string;
  description: string;
  createdAt: string;
}

export enum TrackerStep {
  WAITING_SUPPORTER = 'waiting-supporter',
  WAITING_CASH_PAYMENT = 'waiting-cash-payment',
  CASH_PAID = 'cash-paid',
  QR_UPLOADED = 'qr-uploaded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DISMISSED = 'dismissed',
  SUPPORT_CONFIRMED = 'support-confirmed', 
  PAYMENT_CONFIRMED = 'payment-confirmed',
  WAITING_POS_CONFIRMATION = 'waiting-pos-confirmation'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  location: string;
  goldenHearts: number;
  silverHearts: number;
  isAvailable: boolean;
  referralCode: string;
  wallet: {
    balance: number;
    totalEarnings: number;
    pendingBalance: number;
  };
}

export interface Transaction {
  id: string;
  seekerId: string;
  supporterId?: string;
  amount: number;
  listingTitle: string;
  status: TrackerStep;
  supportPercentage: 20 | 100;
  qrUrl?: string;
  createdAt: string;
  qrUploadedAt?: string;
  completedAt?: string;
  
  seekerName?: string;
  supporterName?: string;
  amounts: {
    seekerPayment: number;
    seekerSavings: number;
    supportAmount: number;
    refundToSupporter: number;
  };
}

export interface SwapListing {
  id: string;
  title: string;
  description: string;
  requiredBalance: number;
  photoUrl: string;
  location: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  createdAt: string;
}

export interface RewardLog {
  id: string;
  sourceUserName: string;
  amount: number;
  createdAt: number;
}

// --- Helpers ---

export const formatName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const calculateTransaction = (amount: number, percentage: 20 | 100) => {
  if (percentage === 100) {
    return {
      seekerPayment: 0,
      seekerSavings: amount,
      supportAmount: amount,
      refundToSupporter: 0
    };
  }
  
  const seekerPayment = amount * 0.8;
  const supportAmount = amount;
  const platformFee = amount * 0.05;
  const refundToSupporter = seekerPayment - platformFee;

  return {
    seekerPayment,
    seekerSavings: amount - seekerPayment,
    supportAmount,
    refundToSupporter
  };
};

// URL Sanitization Helpers
const sanitizePhotoUrl = (url: string | null | undefined): string => {
    if (!url) return 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60';
    if (url.startsWith('blob:')) return 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60';
    return url;
};

const sanitizeAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return 'https://picsum.photos/200';
    if (url.startsWith('blob:')) return 'https://picsum.photos/200';
    return url;
};

// --- Services ---

const DEFAULT_USER: User = {
  id: 'current-user',
  name: 'Kullanıcı',
  avatar: 'https://picsum.photos/200',
  rating: 0,
  location: '',
  goldenHearts: 0,
  silverHearts: 0,
  isAvailable: false,
  referralCode: '',
  wallet: {
    balance: 0,
    totalEarnings: 0,
    pendingBalance: 0
  }
};

export const ReferralService = {
  getUserProfile: (): User => {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
          const user = JSON.parse(stored);
          // Sanitize avatar in case local storage has a blob url
          user.avatar = sanitizeAvatarUrl(user.avatar);
          return user;
      }
      return DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  },
  saveUserProfile: (user: User) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
  },
  logout: () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('active_tx'); 
    window.dispatchEvent(new Event('storage'));
  },
  processReward: (tx: Transaction) => {
     // Backend rewards logic
  },
  getLogs: (): RewardLog[] => {
      return [];
  }
};

export const TransactionService = {
  getHistory: (): Transaction[] => {
    return [];
  },
  getActive: (): Transaction | null => {
    try {
      const stored = localStorage.getItem('active_tx');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },
  save: (tx: Transaction) => {
    localStorage.setItem('active_tx', JSON.stringify(tx));
    window.dispatchEvent(new Event('storage'));
  },
  clearActive: () => {
    localStorage.removeItem('active_tx');
    window.dispatchEvent(new Event('storage'));
  }
};

export const DBService = {
  getUserProfile: async (id: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        
        if (error) { 
            if (error.code !== 'PGRST116') {
                console.warn("Profile fetch error:", error);
            }
            return null;
        }
        
        if (data) {
            return {
                id: data.id,
                name: data.full_name,
                avatar: sanitizeAvatarUrl(data.avatar_url),
                rating: data.rating || 5.0,
                location: data.location || 'İstanbul',
                goldenHearts: data.golden_hearts || 0,
                silverHearts: data.silver_hearts || 0,
                isAvailable: true,
                referralCode: data.referral_code || 'REF',
                wallet: {
                  balance: data.wallet_balance || 0,
                  totalEarnings: data.total_earnings || 0,
                  pendingBalance: 0
                }
            };
        }
    } catch (e) {
        console.error("Critical Profile Error:", e);
    }
    return null;
  },

  upsertProfile: async (user: User) => {
      if (!isSupabaseConfigured()) return;
      
      const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: user.name,
          avatar_url: user.avatar,
          rating: user.rating,
          location: user.location,
          golden_hearts: user.goldenHearts,
          silver_hearts: user.silverHearts,
          referral_code: user.referralCode,
          wallet_balance: user.wallet.balance,
          total_earnings: user.wallet.totalEarnings
      }, { onConflict: 'id' });

      if (error) {
          console.error("Upsert profile error:", error);
      }
  },

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`*, seeker:seeker_id(full_name), supporter:supporter_id(full_name)`)
            .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
            .neq('status', 'dismissed')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 errors in console

        if (error) { 
             console.error("Get Active Tx Error:", error);
             return null;
        }

        if (data) {
            return {
                id: data.id,
                seekerId: data.seeker_id,
                supporterId: data.supporter_id,
                amount: data.amount,
                listingTitle: data.listing_title,
                status: data.status,
                supportPercentage: data.support_percentage,
                qrUrl: data.qr_url,
                createdAt: data.created_at,
                qrUploadedAt: data.qr_uploaded_at,
                completedAt: data.completed_at,
                seekerName: formatName(data.seeker?.full_name),
                supporterName: data.supporter ? formatName(data.supporter.full_name) : undefined,
                amounts: calculateTransaction(data.amount, data.support_percentage)
            };
        }
    } catch (e) {
        console.error("Get Active Tx Error", e);
    }
    return null;
  },

  createTransactionRequest: async (userId: string, amount: number, description: string) => {
     const { data, error } = await supabase
        .from('transactions')
        .insert({
            seeker_id: userId,
            amount: amount,
            listing_title: description,
            status: 'waiting-supporter',
            support_percentage: 20 
        })
        .select()
        .single();
        
    if (error) {
        console.error("Supabase Create Tx Error:", error);
        throw error;
    }
    if (!data) throw new Error("İşlem oluşturuldu ancak veri dönmedi.");
    return data;
  },

  getPendingTransactions: async (): Promise<any[]> => { 
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`*, profiles:seeker_id(full_name, avatar_url, rating)`)
            .eq('status', 'waiting-supporter')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Map and sanitize avatars
        return (data || []).map((item: any) => {
            if (item.profiles) {
                item.profiles.avatar_url = sanitizeAvatarUrl(item.profiles.avatar_url);
            }
            return item;
        });
    } catch (e) {
        console.error("Pending transactions error:", e);
        return [];
    }
  },

  acceptTransaction: async (txId: string, supporterId: string, percentage: number) => {
    if (isUUID(txId)) {
        const { data, error } = await supabase
            .from('transactions')
            .update({
                supporter_id: supporterId,
                status: 'waiting-cash-payment',
                support_percentage: percentage
            })
            .eq('id', txId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    throw new Error("Geçersiz işlem ID");
  },

  markCashPaid: async (txId: string) => {
      const { error } = await supabase.from('transactions').update({ status: 'cash-paid' }).eq('id', txId);
      if (error) throw error;
  },

  submitQR: async (txId: string, url: string) => {
      const { error } = await supabase.from('transactions')
          .update({ status: 'qr-uploaded', qr_url: url, qr_uploaded_at: new Date().toISOString() }).eq('id', txId);
      if (error) throw error;
  },

  completeTransaction: async (txId: string) => {
      const { error } = await supabase.from('transactions')
          .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', txId);
      if (error) throw error;
  },

  failTransaction: async (txId: string) => {
      const { error } = await supabase.from('transactions').update({ status: 'failed' }).eq('id', txId);
      if (error) throw error;
  },

  cancelTransaction: async (txId: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', txId);
      if (error) throw error;
  },

  withdrawSupport: async (txId: string) => {
      const { error } = await supabase.from('transactions')
          .update({ status: 'waiting-supporter', supporter_id: null, support_percentage: 20 }).eq('id', txId);
      if (error) throw error;
  },

  dismissTransaction: async (txId: string) => {
      const { error } = await supabase.from('transactions').update({ status: 'dismissed' }).eq('id', txId);
      if (error) throw error;
      TransactionService.clearActive();
  },

  // --- Storage ---
  uploadQR: async (file: File): Promise<string> => { 
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage.from('qr-codes').upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(filePath);
          return publicUrl;
      } catch (error) {
          console.error("Supabase Storage error (QR):", error);
          throw error; 
      }
  },

  // --- Profile Updates ---
  updateUserProfile: async (id: string, data: Partial<User>) => {
    const updates: any = {};
    if (data.name) updates.full_name = data.name;
    if (data.location) updates.location = data.location;
    if (data.avatar) updates.avatar_url = data.avatar;
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    
    // Update local cache
    const current = ReferralService.getUserProfile();
    ReferralService.saveUserProfile({ ...current, ...data });
  },

  uploadAvatar: async (file: File) => { 
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `avatars/${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error } = await supabase.storage.from('images').upload(fileName, file);
          
          if (error) throw error;
          
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          return data.publicUrl;
      } catch (e) {
          console.error("Resim yükleme hatası (Supabase):", e);
          throw e;
      }
  },
};

export const SwapService = {
  getListings: async (): Promise<SwapListing[]> => {
    // 1. If not configured, return empty array immediately (NO MOCK DATA)
    if (!isSupabaseConfigured()) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('swap_listings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Listings fetch error (Supabase):", error);
            return [];
        }
        
        if (!data || data.length === 0) return []; 

        return data.map((item: any) => {
            return {
              id: item.id,
              title: item.title,
              description: item.description,
              requiredBalance: item.required_balance,
              photoUrl: sanitizePhotoUrl(item.photo_url),
              location: item.location || 'İstanbul',
              ownerId: item.owner_id,
              ownerName: item.owner_name || 'Kullanıcı',
              ownerAvatar: sanitizeAvatarUrl(item.owner_avatar),
              createdAt: item.created_at
            };
        });
    } catch (e) {
        console.error("Swap Service Critical Error:", e);
        return [];
    }
  },

  getListingById: async (id: string): Promise<SwapListing | null> => {
     if (!isSupabaseConfigured()) return null;

     try {
         const { data, error } = await supabase
             .from('swap_listings')
             .select('*')
             .eq('id', id)
             .single();
         
         if (error) {
             console.error("Swap item detail error:", error);
             return null;
         }

         if (data) {
             return {
                id: data.id,
                title: data.title,
                description: data.description,
                requiredBalance: data.required_balance,
                photoUrl: sanitizePhotoUrl(data.photo_url),
                location: data.location || 'İstanbul',
                ownerId: data.owner_id,
                ownerName: data.owner_name || 'Kullanıcı',
                ownerAvatar: sanitizeAvatarUrl(data.owner_avatar),
                createdAt: data.created_at
             };
         }
     } catch (e) {
         console.error(e);
     }
     return null;
  },

  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    // Strict Supabase Check
    if (!isSupabaseConfigured()) {
        throw new Error("Veritabanı bağlantısı bulunamadı. Lütfen Supabase yapılandırmasını kontrol edin.");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum açmanız gerekiyor.");

    let userName = user.user_metadata.full_name || 'Kullanıcı';
    let userAvatar = user.user_metadata.avatar_url || 'https://picsum.photos/200';

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if(profile) {
        userName = profile.full_name;
        userAvatar = profile.avatar_url;
    }

    const { error } = await supabase.from('swap_listings').insert({
        owner_id: user.id,
        title,
        description,
        required_balance: price,
        photo_url: photoUrl,
        owner_name: userName,
        owner_avatar: userAvatar,
        location: 'İstanbul'
    });
    
    if (error) {
        console.error("Create Listing Error:", error);
        throw error;
    }
  },

  deleteListing: async (id: string) => {
      if (!isSupabaseConfigured()) throw new Error("Veritabanı bağlantısı yok");

      const { error } = await supabase.from('swap_listings').delete().eq('id', id);
      if (error) throw error;
  },

  uploadImage: async (file: File): Promise<string> => {
      if (!isSupabaseConfigured()) {
           throw new Error("Resim yüklemek için veritabanı bağlantısı gerekli.");
      }

      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `swap/${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error } = await supabase.storage.from('images').upload(fileName, file);
          
          if (error) throw error;
          
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          return data.publicUrl;
      } catch (e) {
          console.error("Resim yükleme hatası:", e);
          throw e;
      }
  }
};

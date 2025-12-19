
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
  if (!fullName) return 'Anonim';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

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

const sanitizeAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return 'https://picsum.photos/200';
    if (typeof url === 'string' && url.startsWith('blob:')) return 'https://picsum.photos/200';
    return url;
};

// --- Services ---

const GUEST_USER: User = {
  id: 'guest',
  name: 'Misafir',
  avatar: 'https://picsum.photos/200',
  rating: 0,
  location: '',
  goldenHearts: 0,
  silverHearts: 0,
  isAvailable: false,
  referralCode: '',
  wallet: { balance: 0, totalEarnings: 0, pendingBalance: 0 }
};

export const ReferralService = {
  getUserProfile: (): User => {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
          const user = JSON.parse(stored);
          if (!user.id || user.id === 'current-user') return GUEST_USER;
          user.avatar = sanitizeAvatarUrl(user.avatar);
          return user;
      }
      return GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  },
  saveUserProfile: (user: User) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
  },
  logout: () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('active_tx'); 
    localStorage.removeItem('workigom-auth-token');
    window.dispatchEvent(new Event('storage'));
  },
  processReward: (tx: Transaction) => {},
  getLogs: (): RewardLog[] => []
};

export const TransactionService = {
  getHistory: (): Transaction[] => [],
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
    if (!id || id === 'guest') return null;
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error || !data) return null;
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
    } catch { return null; }
  },

  upsertProfile: async (user: User) => {
      if (!isSupabaseConfigured() || user.id === 'guest') return;
      await supabase.from('profiles').upsert({
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
      });
  },

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured() || !userId || userId === 'guest') return null;
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
            .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
            .neq('status', 'dismissed')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;

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
    } catch { return null; }
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
        
    if (error) throw error;
    return data;
  },

  getPendingTransactions: async (): Promise<any[]> => { 
    if (!isSupabaseConfigured()) return [];
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, profiles!seeker_id(*)')
            .eq('status', 'waiting-supporter')
            .order('created_at', { ascending: false });

        if (error) {
            const { data: basicData, error: basicError } = await supabase
                .from('transactions')
                .select('*')
                .eq('status', 'waiting-supporter')
                .order('created_at', { ascending: false });
            
            if (basicError) throw basicError;
            return basicData || [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
  },

  acceptTransaction: async (txId: string, supporterId: string, percentage: number) => {
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
  },

  markCashPaid: async (txId: string) => {
      await supabase.from('transactions').update({ status: 'cash-paid' }).eq('id', txId);
  },

  submitQR: async (txId: string, url: string) => {
      await supabase.from('transactions')
          .update({ status: 'qr-uploaded', qr_url: url, qr_uploaded_at: new Date().toISOString() }).eq('id', txId);
  },

  completeTransaction: async (txId: string) => {
      await supabase.from('transactions')
          .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', txId);
  },

  failTransaction: async (txId: string) => {
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', txId);
  },

  cancelTransaction: async (txId: string) => {
      await supabase.from('transactions').delete().eq('id', txId);
  },

  withdrawSupport: async (txId: string) => {
      await supabase.from('transactions')
          .update({ status: 'waiting-supporter', supporter_id: null, support_percentage: 20 }).eq('id', txId);
  },

  dismissTransaction: async (txId: string) => {
      await supabase.from('transactions').update({ status: 'dismissed' }).eq('id', txId);
      TransactionService.clearActive();
  },

  uploadQR: async (file: File): Promise<string> => { 
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('qr-codes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(fileName);
      return publicUrl;
  },

  updateUserProfile: async (id: string, data: Partial<User>) => {
    const updates: any = {};
    if (data.name) updates.full_name = data.name;
    if (data.location) updates.location = data.location;
    if (data.avatar) updates.avatar_url = data.avatar;
    await supabase.from('profiles').update(updates).eq('id', id);
  },

  uploadAvatar: async (file: File) => { 
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
  },
};

export const SwapService = {
  getListings: async (): Promise<SwapListing[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
        const { data, error } = await supabase
            .from('swap_listings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          requiredBalance: item.required_balance,
          photoUrl: item.photo_url || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60',
          location: item.location || 'İstanbul',
          ownerId: item.owner_id,
          ownerName: item.owner_name || 'Kullanıcı',
          ownerAvatar: sanitizeAvatarUrl(item.owner_avatar),
          createdAt: item.created_at
        }));
    } catch { return []; }
  },

  getListingById: async (id: string): Promise<SwapListing | null> => {
     if (!isSupabaseConfigured()) return null;
     const { data, error } = await supabase.from('swap_listings').select('*').eq('id', id).maybeSingle();
     if (error || !data) return null;
     return {
        id: data.id,
        title: data.title,
        description: data.description,
        requiredBalance: data.required_balance,
        photoUrl: data.photo_url || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60',
        location: data.location || 'İstanbul',
        ownerId: data.owner_id,
        ownerName: data.owner_name || 'Kullanıcı',
        ownerAvatar: sanitizeAvatarUrl(data.owner_avatar),
        createdAt: data.created_at
     };
  },

  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    if (!isSupabaseConfigured()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum gerekli");
    await supabase.from('swap_listings').insert({
        owner_id: user.id,
        title,
        description,
        required_balance: price,
        photo_url: photoUrl,
        owner_name: user.user_metadata.full_name || 'Kullanıcı',
        owner_avatar: user.user_metadata.avatar_url || 'https://picsum.photos/200',
        location: 'İstanbul'
    });
  },

  deleteListing: async (id: string) => {
      await supabase.from('swap_listings').delete().eq('id', id);
  },

  uploadImage: async (file: File): Promise<string> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `swap/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
  }
};

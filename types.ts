
import { supabase, isSupabaseConfigured } from './lib/supabase';

export enum VoucherCompany {
  SODEXO = 'Sodexo',
  MULTINET = 'Multinet',
  TICKET = 'Ticket Edenred',
  SETCARD = 'Setcard',
  METROPOL = 'Metropol',
  OTHER = 'Diğer'
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

export interface RewardLog {
  id: string;
  amount: number;
  sourceUserName: string;
  createdAt: string;
}

export interface SwapListing {
  id: string;
  title: string;
  description: string;
  requiredBalance: number;
  photoUrl: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  location: string;
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
  DISMISSED = 'dismissed'
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
  seekerName?: string;
  supporterName?: string;
  amounts: {
    contribution: number;
    fee: number;
    supporterTotalPay: number;
    seekerPayment: number;
    netToSupporter: number;
  };
}

export const formatName = (fullName: string): string => {
  if (!fullName) return 'Anonim';
  const parts = fullName.trim().split(' ');
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

export const calculateTransaction = (totalAmount: number, percentage: 20 | 100 = 20) => {
  if (percentage === 100) {
    return {
      contribution: totalAmount,
      fee: 0,
      supporterTotalPay: totalAmount,
      seekerPayment: 0,
      netToSupporter: 0
    };
  }
  
  const contribution = totalAmount * 0.20;
  const fee = totalAmount * 0.05;
  const seekerPayment = totalAmount * 0.80;
  
  return {
    contribution,
    fee,
    supporterTotalPay: contribution + fee,
    seekerPayment,
    netToSupporter: seekerPayment - fee
  };
};

// Fixed error on line 126: Removed 'seeker_id' property as it is not part of Transaction interface
export const mapDBTransaction = (dbItem: any): Transaction => ({
  id: dbItem.id,
  seekerId: dbItem.seeker_id,
  supporterId: dbItem.supporter_id,
  amount: dbItem.amount,
  listingTitle: dbItem.listing_title,
  status: dbItem.status as TrackerStep,
  supportPercentage: dbItem.support_percentage || 20,
  qrUrl: dbItem.qr_url,
  createdAt: dbItem.created_at,
  seekerName: dbItem.seeker?.full_name ? formatName(dbItem.seeker.full_name) : 'Alıcı',
  supporterName: dbItem.supporter?.full_name ? formatName(dbItem.supporter.full_name) : undefined,
  amounts: calculateTransaction(dbItem.amount, dbItem.support_percentage || 20)
});

export const ReferralService = {
  getUserProfile: (): User | null => {
    try {
      const stored = localStorage.getItem('user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },
  saveUserProfile: (user: User) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
  },
  logout: () => {
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
  },
  getLogs: (): RewardLog[] => {
    try {
      const stored = localStorage.getItem('reward_logs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }
};

export const DBService = {
  getUserProfile: async (id: string): Promise<User | null> => {
    if (!isSupabaseConfigured() || !id) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.full_name,
        avatar: data.avatar_url || 'https://picsum.photos/200',
        rating: data.rating || 5.0,
        location: data.location || 'İstanbul',
        goldenHearts: data.golden_hearts || 0,
        silverHearts: data.silver_hearts || 0,
        isAvailable: true,
        referralCode: data.referral_code || 'REF',
        wallet: { balance: data.wallet_balance || 0, totalEarnings: data.total_earnings || 0, pendingBalance: 0 }
      };
    } catch { return null; }
  },

  createTransactionRequest: async (userId: string, amount: number, description: string) => {
    if (!isSupabaseConfigured()) throw new Error("Ağ yok.");
    const { data, error } = await supabase.from('transactions').insert({
      seeker_id: userId,
      amount,
      listing_title: description,
      status: TrackerStep.WAITING_SUPPORTER,
      support_percentage: 20
    }).select().single();
    if (error) throw error;
    return data;
  },

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data, error } = await supabase.from('transactions')
        .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
        .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
        .neq('status', TrackerStep.DISMISSED)
        .neq('status', TrackerStep.CANCELLED)
        .neq('status', TrackerStep.FAILED)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapDBTransaction(data);
    } catch { return null; }
  },

  getPendingTransactions: async () => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.from('transactions')
      .select(`*, profiles!seeker_id(full_name, avatar_url, location, rating)`)
      .eq('status', TrackerStep.WAITING_SUPPORTER)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  acceptTransaction: async (txId: string, supporterId: string, percentage: 20 | 100) => {
    const { error: updateError } = await supabase.from('transactions')
      .update({ 
        supporter_id: supporterId, 
        status: TrackerStep.WAITING_CASH_PAYMENT,
        support_percentage: percentage
      })
      .match({ id: txId, status: TrackerStep.WAITING_SUPPORTER });
      
    if (updateError) throw updateError;

    const { data, error: selectError } = await supabase.from('transactions')
      .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
      .eq('id', txId)
      .single();
      
    if (selectError) throw selectError;
    return data;
  },

  uploadQR: async (file: File): Promise<string> => {
    return await fileToBase64(file);
  },

  submitQR: async (txId: string, qrUrl: string) => {
    const { error } = await supabase.from('transactions').update({ 
      status: TrackerStep.QR_UPLOADED, 
      qr_url: qrUrl 
    }).eq('id', txId);
    if (error) throw error;
  },

  withdrawSupport: async (txId: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) throw error;
  },

  dismissTransaction: async (txId: string) => {
    const { error } = await supabase.from('transactions').update({ status: TrackerStep.DISMISSED }).eq('id', txId);
    if (error) throw error;
  },

  markCashPaid: async (txId: string) => {
    const { error } = await supabase.from('transactions').update({ status: TrackerStep.CASH_PAID }).eq('id', txId);
    if (error) throw error;
  },

  completeTransaction: async (txId: string) => {
    const { error } = await supabase.from('transactions').update({ 
      status: TrackerStep.COMPLETED, 
      completed_at: new Date().toISOString() 
    }).eq('id', txId);
    if (error) throw error;
  },

  cancelTransaction: async (txId: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) throw error;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    return await fileToBase64(file);
  },

  updateUserProfile: async (id: string, updates: { name: string, location: string, avatar: string }) => {
    const { error } = await supabase.from('profiles').update({
      full_name: updates.name,
      location: updates.location,
      avatar_url: updates.avatar
    }).eq('id', id);
    if (error) throw error;
    
    const current = ReferralService.getUserProfile();
    if (current && current.id === id) {
      ReferralService.saveUserProfile({ ...current, name: updates.name, location: updates.location, avatar: updates.avatar });
    }
  }
};

export const SwapService = {
  getListings: async (): Promise<SwapListing[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.from('swap_listings').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      requiredBalance: item.required_balance,
      photoUrl: item.photo_url,
      ownerId: item.owner_id,
      ownerName: item.owner_name,
      ownerAvatar: item.owner_avatar,
      location: item.location,
      createdAt: item.created_at
    }));
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
      photoUrl: data.photo_url,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      ownerAvatar: data.owner_avatar,
      location: data.location,
      createdAt: data.created_at
    };
  },
  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    const user = ReferralService.getUserProfile();
    if (!user) return;
    const { error } = await supabase.from('swap_listings').insert({
      title,
      description,
      required_balance: price,
      photo_url: photoUrl,
      owner_id: user.id,
      owner_name: user.name,
      owner_avatar: user.avatar,
      location: user.location
    });
    if (error) throw error;
  },
  deleteListing: async (id: string) => {
    await supabase.from('swap_listings').delete().eq('id', id);
  },
  uploadImage: async (file: File): Promise<string> => {
    return await fileToBase64(file);
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
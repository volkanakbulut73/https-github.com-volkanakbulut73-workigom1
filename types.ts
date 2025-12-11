
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

// Updated Enum to match Database Status Values exactly
export enum TrackerStep {
  WAITING_SUPPORTER = 'waiting-supporter',
  WAITING_CASH_PAYMENT = 'waiting-cash-payment',
  CASH_PAID = 'cash-paid',
  QR_UPLOADED = 'qr-uploaded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DISMISSED = 'dismissed', // Added for archival
  // UI helper states (not in DB)
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

// Updated Transaction Interface for 'transactions' table
export interface Transaction {
  id: string;
  seekerId: string;
  supporterId?: string; // Nullable in DB
  amount: number;
  listingTitle: string; // listing_title in DB
  status: TrackerStep;
  supportPercentage: 20 | 100;
  qrUrl?: string;
  createdAt: string; // timestamptz
  qrUploadedAt?: string; // timestamptz
  completedAt?: string; // timestamptz
  
  // Computed/Joined fields
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  isRead: boolean;
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

export const calculateTransaction = (amount: number, percentage: 20 | 100) => {
  if (percentage === 100) {
    return {
      seekerPayment: 0,
      seekerSavings: amount,
      supportAmount: amount,
      refundToSupporter: 0
    };
  }
  // 20% case
  const seekerPayment = amount * 0.2; // User pays 20% in cash
  const supportAmount = amount * 0.8; // Supporter pays 80% via card
  const platformFee = supportAmount * 0.05; // 5% fee on support amount
  const refundToSupporter = seekerPayment - platformFee; // Supporter gets cash minus fee

  return {
    seekerPayment,
    seekerSavings: amount - seekerPayment,
    supportAmount,
    refundToSupporter
  };
};

// --- Services ---

const DEFAULT_USER: User = {
  id: 'current-user',
  name: 'Misafir Kullanıcı',
  avatar: 'https://picsum.photos/200',
  rating: 5.0,
  location: 'İstanbul',
  goldenHearts: 0,
  silverHearts: 0,
  isAvailable: true,
  referralCode: 'GUEST',
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
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  },
  saveUserProfile: (user: User) => {
    localStorage.setItem('user_profile', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
  },
  processReward: (tx: Transaction) => {
    const user = ReferralService.getUserProfile();
    if (tx.status === TrackerStep.COMPLETED) {
       user.wallet.totalEarnings += 10; 
       ReferralService.saveUserProfile(user);
    }
  },
  getLogs: (): RewardLog[] => {
      return [];
  }
};

export const TransactionService = {
  // Local storage fallback for offline demo
  getHistory: (): Transaction[] => {
    try {
      const stored = localStorage.getItem('tx_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
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
    if (isSupabaseConfigured()) {
       const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
       if (data && !error) {
           return {
             id: data.id,
             name: data.full_name,
             avatar: data.avatar_url || 'https://picsum.photos/200',
             rating: data.rating || 5.0,
             location: 'İstanbul', // Default if missing
             goldenHearts: 0,
             silverHearts: 0,
             isAvailable: true,
             referralCode: 'REF',
             wallet: {
               balance: data.wallet_balance || 0,
               totalEarnings: 0,
               pendingBalance: 0
             }
           };
       }
    }
    return ReferralService.getUserProfile();
  },

  getUnreadCounts: async (id: string) => {
    return { messages: 0, notifications: 0 };
  },

  // --- Transactions Table Methods ---

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (isSupabaseConfigured()) {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                seeker:seeker_id(full_name),
                supporter:supporter_id(full_name)
            `)
            .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
            // Exclude dismissed (archived) and cancelled.
            // INCLUDES 'completed' so the success screen persists.
            .neq('status', 'dismissed')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

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
    }
    return TransactionService.getActive();
  },

  createTransactionRequest: async (userId: string, amount: number, description: string) => {
     if (isSupabaseConfigured()) {
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                seeker_id: userId,
                amount: amount,
                listing_title: description,
                status: 'waiting-supporter',
                support_percentage: 20 // Default initially
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
     }
     return { id: `tx-${Date.now()}` };
  },

  getPendingTransactions: async (): Promise<any[]> => { 
    if (isSupabaseConfigured()) {
        const { data } = await supabase
            .from('transactions')
            .select(`
                *,
                profiles:seeker_id(full_name, avatar_url, rating)
            `)
            .eq('status', 'waiting-supporter')
            .order('created_at', { ascending: false });
        return data || [];
    }
    return []; 
  },

  acceptTransaction: async (txId: string, supporterId: string, percentage: number) => {
    if (isSupabaseConfigured() && isUUID(txId)) {
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
    return { id: txId, seeker_id: 'seeker-uuid', amount: 0, listing_title: '', created_at: '', support_percentage: percentage, status: 'waiting-cash-payment' };
  },

  markCashPaid: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ status: 'cash-paid' })
              .eq('id', txId);
          if (error) throw error;
      }
  },

  submitQR: async (txId: string, url: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ 
                  status: 'qr-uploaded',
                  qr_url: url,
                  qr_uploaded_at: new Date().toISOString()
              })
              .eq('id', txId);
          if (error) throw error;
      }
  },

  completeTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ 
                  status: 'completed',
                  completed_at: new Date().toISOString()
              })
              .eq('id', txId);
          if (error) throw error;
      }
  },

  failTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ status: 'failed' })
              .eq('id', txId);
          if (error) throw error;
      }
  },

  cancelTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          // Using DELETE to handle cancellation clearly on backend
          const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('id', txId);
          if (error) throw error;
      }
      // If not UUID or not configured, it's local state, frontend will clear it
  },

  withdrawSupport: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ 
                  status: 'waiting-supporter',
                  supporter_id: null,
                  support_percentage: 20
              })
              .eq('id', txId);
          if (error) throw error;
      }
  },

  dismissTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase
              .from('transactions')
              .update({ status: 'dismissed' })
              .eq('id', txId);
          if (error) throw error;
      }
      TransactionService.clearActive();
  },

  // --- Storage ---
  uploadQR: async (file: File): Promise<string> => { 
      if (isSupabaseConfigured()) {
          try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
              const filePath = `${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('qr-codes')
                .upload(filePath, file);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('qr-codes')
                .getPublicUrl(filePath);

              return publicUrl;
          } catch (error) {
              console.warn("Supabase Storage error (likely bucket missing), falling back to Base64:", error);
              return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = error => reject(error);
              });
          }
      }
      return URL.createObjectURL(file); 
  },

  // --- Profile Updates ---
  updateUserProfile: async (id: string, data: Partial<User>) => {
    if (isSupabaseConfigured()) {
        const updates: any = {};
        if (data.name) updates.full_name = data.name;
        // ... map other fields
        await supabase.from('profiles').update(updates).eq('id', id);
    }
    const current = ReferralService.getUserProfile();
    ReferralService.saveUserProfile({ ...current, ...data });
  },

  uploadAvatar: async (file: File) => { return URL.createObjectURL(file); },

  // --- Messaging (Mock for now) ---
  getInbox: async () => { return []; },
  getChatHistory: async (userId: string, lastTime?: number) => { return []; },
  markAsRead: async (userId: string) => {},
  sendMessage: async (userId: string, content: string) => {
    return {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      receiverId: userId,
      content,
      createdAt: Date.now(),
      isRead: false
    };
  }
};

export const SwapService = {
  getListings: async (): Promise<SwapListing[]> => {
      return [];
  },
  uploadImage: async (file: File): Promise<string> => { return URL.createObjectURL(file); },
  createListing: async (title: string, description: string, price: number, photo: string) => {},
  getListingById: async (id: string): Promise<SwapListing | null> => { return null; },
  deleteListing: async (id: string) => {}
};

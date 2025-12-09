
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
  WAITING_SUPPORTER = 'WAITING_SUPPORTER',
  SUPPORT_CONFIRMED = 'SUPPORT_CONFIRMED',
  WAITING_CASH_PAYMENT = 'WAITING_CASH_PAYMENT',
  CASH_PAID = 'CASH_PAID',
  WAITING_QR_UPLOAD = 'WAITING_QR_UPLOAD',
  QR_UPLOADED = 'QR_UPLOADED',
  WAITING_POS_CONFIRMATION = 'WAITING_POS_CONFIRMATION',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
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
  listingId: string;
  seekerId: string;
  supporterId: string;
  seekerName: string;
  supporterName: string;
  supportPercentage: 20 | 100;
  amounts: {
    seekerPayment: number;
    seekerSavings: number;
    supportAmount: number;
    refundToSupporter: number;
  };
  status: TrackerStep;
  createdAt: number;
  qrUrl?: string;
  qrUploadedAt?: number;
  completedAt?: number;
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

// --- Services (Mock Implementations) ---

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
    const history = TransactionService.getHistory();
    const index = history.findIndex(t => t.id === tx.id);
    if (index >= 0) {
      history[index] = tx;
    } else {
      history.push(tx);
    }
    localStorage.setItem('tx_history', JSON.stringify(history));
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
             location: data.location || 'Konum Yok',
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
    }
    return ReferralService.getUserProfile();
  },
  getUnreadCounts: async (id: string) => {
    return { messages: 0, notifications: 0 };
  },
  getActiveTransaction: async (id: string): Promise<any> => {
    const tx = TransactionService.getActive();
    if(tx && (tx.seekerId === id || tx.supporterId === id)) {
        return { 
            ...tx, 
            supporter_id: tx.supporterId, 
            seeker_id: tx.seekerId, 
            qr_url: tx.qrUrl, 
            qr_uploaded_at: tx.qrUploadedAt, 
            status: tx.status, 
            amount: tx.amounts.supportAmount / (tx.supportPercentage === 20 ? 0.8 : 1), 
            support_percentage: tx.supportPercentage,
            supporter: { full_name: tx.supporterName },
            seeker: { full_name: tx.seekerName }
        };
    }
    return null;
  },
  createTransactionRequest: async (userId: string, amount: number, description: string) => {
     if (isSupabaseConfigured()) {
       // Insert into database if configured
       // This part would map to your real tables
     }
     return { id: `tx-${Date.now()}` };
  },
  markCashPaid: async (txId: string) => {},
  completeTransaction: async (txId: string) => {},
  failTransaction: async (txId: string) => {},
  cancelTransaction: async (txId: string) => {},
  getPendingTransactions: async (): Promise<any[]> => { 
    if (isSupabaseConfigured()) {
        const { data } = await supabase
            .from('swap_listings')
            .select('*')
            .order('created_at', { ascending: false });
        return data || [];
    }
    return []; 
  },
  acceptTransaction: async (listingId: string, supporterId: string, percentage: number) => {
    return { id: listingId, seeker_id: 'seeker-uuid', supporter_id: supporterId };
  },
  uploadQR: async (file: File) => { return URL.createObjectURL(file); },
  submitQR: async (txId: string, url: string) => {},
  withdrawSupport: async (txId: string) => {},
  dismissTransaction: async (txId: string) => {},
  updateUserProfile: async (id: string, data: Partial<User>) => {
    if (isSupabaseConfigured()) {
        const updates: any = {};
        if (data.name) updates.full_name = data.name;
        if (data.location) updates.location = data.location;
        if (data.avatar) updates.avatar_url = data.avatar;
        
        await supabase.from('profiles').update(updates).eq('id', id);
    }
    const current = ReferralService.getUserProfile();
    ReferralService.saveUserProfile({ ...current, ...data });
  },
  uploadAvatar: async (file: File) => { return URL.createObjectURL(file); },
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
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('swap_listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase error fetching swap_listings:", error);
          throw error;
        }

        // Map Supabase columns to TypeScript interface
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          requiredBalance: item.required_balance, // mapped from snake_case
          photoUrl: item.photo_url || 'https://picsum.photos/300/400', // mapped from snake_case
          location: item.location || 'Konum Yok',
          ownerId: item.owner_id, // mapped from snake_case
          ownerName: item.owner_name || 'Kullanıcı', // mapped from snake_case
          ownerAvatar: item.owner_avatar || 'https://picsum.photos/100', // mapped from snake_case
          createdAt: item.created_at
        }));
      } catch (e) {
        console.error("Listings fetch failed, using fallback", e);
      }
    }

    try {
      const stored = localStorage.getItem('swap_listings');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  },

  uploadImage: async (file: File): Promise<string> => {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('listing_images')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('listing_images')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (e) {
        console.error("Image upload failed", e);
        return URL.createObjectURL(file);
      }
    }
    return URL.createObjectURL(file);
  },

  createListing: async (title: string, description: string, price: number, photo: string) => {
    const user = ReferralService.getUserProfile();
    
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      const ownerId = session?.user?.id || user.id;

      // Ensure we are inserting into 'swap_listings' with correct columns
      const { error } = await supabase
        .from('swap_listings')
        .insert({
          title: title,
          description: description,
          required_balance: price, // integer
          photo_url: photo,        // text
          owner_id: ownerId,       // text
          owner_name: user.name,   // text
          owner_avatar: user.avatar, // text
          location: user.location
          // id is auto-generated
          // created_at is auto-generated
        });

      if (error) {
        console.error("Error creating listing in Supabase:", error);
        throw error;
      }
      return; 
    }

    // Local Storage Fallback
    const listings = await SwapService.getListings();
    const newItem: SwapListing = {
      id: `swap-${Date.now()}`,
      title,
      description,
      requiredBalance: price,
      photoUrl: photo,
      location: user.location,
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatar,
      createdAt: new Date().toISOString()
    };
    listings.unshift(newItem);
    localStorage.setItem('swap_listings', JSON.stringify(listings));
  },

  getListingById: async (id: string): Promise<SwapListing | null> => {
    if (isSupabaseConfigured() && !id.startsWith('swap-')) {
       try {
         const { data, error } = await supabase
           .from('swap_listings')
           .select('*')
           .eq('id', id)
           .single();
         
         if (data) {
           return {
             id: data.id,
             title: data.title,
             description: data.description,
             requiredBalance: data.required_balance,
             photoUrl: data.photo_url,
             location: data.location,
             ownerId: data.owner_id,
             ownerName: data.owner_name,
             ownerAvatar: data.owner_avatar,
             createdAt: data.created_at
           };
         }
       } catch (e) { console.error(e); }
    }

     const listings = await SwapService.getListings();
     return listings.find(l => l.id === id) || null;
  },

  deleteListing: async (id: string) => {
    if (isSupabaseConfigured() && !id.startsWith('swap-')) {
       await supabase.from('swap_listings').delete().eq('id', id);
       return;
    }

    let listings = await SwapService.getListings();
    listings = listings.filter(l => l.id !== id);
    localStorage.setItem('swap_listings', JSON.stringify(listings));
  }
};

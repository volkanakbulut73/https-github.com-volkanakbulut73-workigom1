

// ... existing imports
import { supabase, isSupabaseConfigured } from './lib/supabase';

// ... (previous interfaces remain the same until Services)
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
  createdAt: string; // Changed to string for consistency with DB timestamptz
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  isRead: boolean;
}

// --- NEW CHAT ROOM TYPES ---
export interface ChatChannel {
  id: string;
  name: string; // e.g. "#genel"
  description: string;
  usersOnline: number;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string; // ISO string
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

// Timeout helper to prevent hanging requests
const withTimeout = <T>(promise: PromiseLike<T>, ms: number = 8000, fallbackValue?: T): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((resolve, reject) => 
            setTimeout(() => {
                if (fallbackValue !== undefined) resolve(fallbackValue);
                else reject(new Error('Request timeout'));
            }, ms)
        )
    ]);
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
  
  const seekerPayment = amount * 0.8; // User pays 80% in cash
  const supportAmount = amount; // Supporter pays full amount via QR
  const platformFee = amount * 0.05; // 5% fee on total amount
  const refundToSupporter = seekerPayment - platformFee; // Supporter gets seeker's payment minus fee

  return {
    seekerPayment,
    seekerSavings: amount - seekerPayment, // 20% savings
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
  logout: () => {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('active_tx'); 
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
       try {
           const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
           if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
               console.warn("Profile fetch error:", error);
           }
           
           if (data) {
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
       } catch (e) {
           console.error(e);
       }
    }
    // Return null if not found in DB so we can handle creation
    return null;
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

              // Timeout for upload to prevent hanging
              const { error: uploadError } = await withTimeout(
                  supabase.storage.from('qr-codes').upload(filePath, file)
              ) as any;

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
  },

  // --- CHAT ROOMS ---
  getChannels: async (): Promise<ChatChannel[]> => {
     // Default Mocks
     const mocks: ChatChannel[] = [
       { id: 'general', name: '#genel', description: 'Workigom genel sohbet alanı', usersOnline: 124 },
       { id: 'trade', name: '#takas-pazari', description: 'İlanlar hakkında tartışma', usersOnline: 45 },
       { id: 'support', name: '#yardim-destek', description: 'Kullanıcı yardımlaşma alanı', usersOnline: 12 },
       { id: 'food', name: '#yemek-onerileri', description: 'Hangi restoran, hangi menü?', usersOnline: 28 },
     ];

     try {
         if (isSupabaseConfigured()) {
             const { data, error } = await supabase.from('channels').select('*');
             
             if (error) {
                 console.warn("Fetch channels error", error);
                 return mocks;
             }

             if (data && data.length > 0) {
                 return data.map((c: any) => ({
                     id: c.id,
                     name: c.name,
                     description: c.topic || '',
                     usersOnline: Math.floor(Math.random() * 50) + 5
                 }));
             }
         }
     } catch (e) {
         console.warn("Error fetching channels", e);
     }
     
     return mocks;
  },

  getChannelMessages: async (channelId: string): Promise<ChannelMessage[]> => {
     try {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('channel_messages')
                .select('*, profiles(full_name, avatar_url)')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })
                .limit(50);
                
            if (!error && data) {
                return data.map((m: any) => ({
                    id: m.id,
                    channelId: m.channel_id,
                    senderId: m.sender_id,
                    senderName: m.profiles?.full_name || 'Anonim',
                    senderAvatar: m.profiles?.avatar_url || 'https://picsum.photos/100',
                    content: m.content,
                    createdAt: m.created_at
                }));
            }
        }
     } catch (e) {
        console.warn("Error fetching messages", e);
     }
     
     return [];
  },

  sendChannelMessage: async (channelId: string, content: string): Promise<ChannelMessage> => {
      const user = ReferralService.getUserProfile();
      
      try {
          if (isSupabaseConfigured()) {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                  const { data, error } = await supabase
                      .from('channel_messages')
                      .insert({
                          channel_id: channelId,
                          sender_id: authUser.id,
                          content: content
                      })
                      .select('*, profiles(full_name, avatar_url)')
                      .single();
                  
                  if (data) {
                     return {
                        id: data.id,
                        channelId: data.channel_id,
                        senderId: data.sender_id,
                        senderName: data.profiles?.full_name || user.name,
                        senderAvatar: data.profiles?.avatar_url || user.avatar,
                        content: data.content,
                        createdAt: data.created_at
                     };
                  }
              }
          }
      } catch (e) {
          console.error("Message send failed", e);
          throw e;
      }

      return {
          id: `msg-${Date.now()}`,
          channelId,
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.avatar,
          content,
          createdAt: new Date().toISOString()
      };
  }
};

// --- Swap Service ---

export const SwapService = {
  getListings: async (): Promise<SwapListing[]> => {
    // Demo mocks
    const mocks: SwapListing[] = [
      {
        id: '1',
        title: 'Sony WH-1000XM4 Kulaklık',
        description: 'Az kullanılmış, kutulu faturalı. Yemek kartı ile takas olur.',
        requiredBalance: 3500,
        photoUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop&q=60',
        location: 'Kadıköy, İstanbul',
        ownerId: 'user-2',
        ownerName: 'Zeynep K.',
        ownerAvatar: 'https://picsum.photos/101/101',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Apple Magic Keyboard',
        description: 'Türkçe Q Klavye, temiz durumda.',
        requiredBalance: 2000,
        photoUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=500&auto=format&fit=crop&q=60',
        location: 'Beşiktaş, İstanbul',
        ownerId: 'user-3',
        ownerName: 'Ahmet Y.',
        ownerAvatar: 'https://picsum.photos/102/102',
        createdAt: new Date().toISOString()
      }
    ];

    if (isSupabaseConfigured()) {
        try {
            // Added timeout wrapper to prevent hanging
            const { data, error } = await withTimeout(
                supabase
                    .from('swap_listings')
                    .select('*')
                    .order('created_at', { ascending: false }),
                5000, // 5s timeout
                { data: [], error: { message: "Timeout" } } as any // Fallback return if timeout
            );

            if (error) {
                console.error("Supabase fetch error:", error);
                // Return empty if RLS blocked or error, to stop loading
                return mocks; 
            }

            if (data && data.length > 0) {
                return data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    requiredBalance: item.required_balance, // MATCHED DB COLUMN
                    photoUrl: item.photo_url || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60',
                    location: item.location || 'İstanbul',
                    ownerId: item.owner_id,
                    ownerName: item.owner_name || 'Kullanıcı', // MATCHED DB COLUMN
                    ownerAvatar: item.owner_avatar || 'https://picsum.photos/200', // MATCHED DB COLUMN
                    createdAt: item.created_at // string from timestamptz
                }));
            }
            
            // If empty data returned from DB, show mocks for demo or empty list
            return mocks;
        } catch (e) {
            console.error("Swap service exception:", e);
            return mocks;
        }
    }

    return mocks;
  },

  getListingById: async (id: string): Promise<SwapListing | null> => {
     if (isSupabaseConfigured()) {
         try {
             const { data, error } = await withTimeout(
                 supabase
                 .from('swap_listings')
                 .select('*')
                 .eq('id', id)
                 .single(),
                 5000
             ) as any;
             
             if (!error && data) {
                 return {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    requiredBalance: data.required_balance,
                    photoUrl: data.photo_url || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60',
                    location: data.location || 'İstanbul',
                    ownerId: data.owner_id,
                    ownerName: data.owner_name || 'Kullanıcı',
                    ownerAvatar: data.owner_avatar || 'https://picsum.photos/200',
                    createdAt: data.created_at
                 };
             }
         } catch (e) {
             console.error(e);
         }
     }
     
     const all = await SwapService.getListings();
     return all.find(l => l.id === id) || null;
  },

  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    if (isSupabaseConfigured()) {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         // Get user profile for name/avatar to insert (denormalized)
         let userName = user.user_metadata?.full_name || 'Kullanıcı';
         let userAvatar = user.user_metadata?.avatar_url;

         // Try to fetch from profiles first for latest data
         const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
         if(profile) {
             userName = profile.full_name;
             userAvatar = profile.avatar_url;
         }

         // Wrap in timeout so it doesn't hang indefinitely
         const { error } = await withTimeout(
             supabase.from('swap_listings').insert({
                 owner_id: user.id,
                 title,
                 description,
                 required_balance: price, // MATCHED DB COLUMN
                 photo_url: photoUrl,
                 owner_name: userName, // Added
                 owner_avatar: userAvatar, // Added
                 location: 'İstanbul' // Default location if not asked
             })
         );
         
         if (error) {
             console.error("Insert listing error:", error);
             throw error;
         }
       } else {
           throw new Error("Kullanıcı oturumu bulunamadı.");
       }
    }
    // No-op for demo if not configured
  },

  deleteListing: async (id: string) => {
      if (isSupabaseConfigured()) {
          await supabase.from('swap_listings').delete().eq('id', id);
      }
  },

  uploadImage: async (file: File): Promise<string> => {
      const fallbackUrl = 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60';
      
      if (isSupabaseConfigured()) {
          try {
              const fileExt = file.name.split('.').pop();
              const fileName = `swap/${Math.random().toString(36).substring(2)}.${fileExt}`;
              
              // Try upload with timeout
              const { error } = await withTimeout(
                  supabase.storage.from('images').upload(fileName, file), 
                  8000
              ) as any;
              
              if (error) {
                  console.warn("Supabase Image Upload Error (Bucket might be missing or RLS blocked):", error);
                  return fallbackUrl; 
              }
              
              const { data } = supabase.storage.from('images').getPublicUrl(fileName);
              return data.publicUrl;
          } catch (e) {
              console.warn("Upload exception", e);
              return fallbackUrl;
          }
      }
      return URL.createObjectURL(file);
  }
};

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

// Simplified Message interface
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number; // We will convert DB timestamptz to timestamp number for easier sorting
  isRead: boolean;
}

export interface RewardLog {
  id: string;
  sourceUserName: string;
  amount: number;
  createdAt: number;
}

// Added for ChatRooms
export interface ChatChannel {
  id: string;
  name: string;
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
  createdAt: string;
}

// --- Helpers ---

export const formatName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper to convert File to Base64 (Prevents blob: URL errors)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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

const MOCK_MESSAGES: Message[] = [
    { id: '1', senderId: 'user-2', receiverId: 'current-user', content: 'Merhaba, ilanınız hala güncel mi?', createdAt: Date.now() - 1000000, isRead: true },
    { id: '2', senderId: 'current-user', receiverId: 'user-2', content: 'Evet, duruyor.', createdAt: Date.now() - 900000, isRead: true },
    { id: '3', senderId: 'user-2', receiverId: 'current-user', content: 'Tamamdır, takas için uygunum.', createdAt: Date.now() - 800000, isRead: false },
];

export const DBService = {
  // ... (previous DBService methods remain until Storage)
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
                 location: 'İstanbul', 
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
    // Fallback Mock Profile
    if (id === 'user-2') return { ...DEFAULT_USER, id: 'user-2', name: 'Mert Demir', avatar: 'https://picsum.photos/100?random=2' };
    return null;
  },

  getUnreadCounts: async (id: string) => {
     if(!isSupabaseConfigured()) return { messages: 1, notifications: 0 };
     
     // Count unread messages
     const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', id)
        .eq('is_read', false);

     return { messages: count || 0, notifications: 0 };
  },

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (isSupabaseConfigured()) {
        const { data } = await supabase
            .from('transactions')
            .select(`*, seeker:seeker_id(full_name), supporter:supporter_id(full_name)`)
            .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
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
                support_percentage: 20 
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
            .select(`*, profiles:seeker_id(full_name, avatar_url, rating)`)
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
          const { error } = await supabase.from('transactions').update({ status: 'cash-paid' }).eq('id', txId);
          if (error) throw error;
      }
  },

  submitQR: async (txId: string, url: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions')
              .update({ status: 'qr-uploaded', qr_url: url, qr_uploaded_at: new Date().toISOString() }).eq('id', txId);
          if (error) throw error;
      }
  },

  completeTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions')
              .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', txId);
          if (error) throw error;
      }
  },

  failTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions').update({ status: 'failed' }).eq('id', txId);
          if (error) throw error;
      }
  },

  cancelTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions').delete().eq('id', txId);
          if (error) throw error;
      }
  },

  withdrawSupport: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions')
              .update({ status: 'waiting-supporter', supporter_id: null, support_percentage: 20 }).eq('id', txId);
          if (error) throw error;
      }
  },

  dismissTransaction: async (txId: string) => {
      if (isSupabaseConfigured() && isUUID(txId)) {
          const { error } = await supabase.from('transactions').update({ status: 'dismissed' }).eq('id', txId);
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

              const { error: uploadError } = await withTimeout(
                  supabase.storage.from('qr-codes').upload(filePath, file),
                  8000
              ) as any;

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(filePath);
              return publicUrl;
          } catch (error) {
              console.warn("Supabase Storage error, fallback to Base64");
              return await fileToBase64(file);
          }
      }
      return await fileToBase64(file); 
  },

  // --- Profile Updates ---
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

  uploadAvatar: async (file: File) => { return await fileToBase64(file); },

  // --- Messaging (REAL IMPLEMENTATION) ---
  
  // Fetches list of conversations
  getInbox: async (): Promise<{id: string, name: string, avatar: string, lastMsg: string, time: Date, unread: number}[]> => { 
    if (!isSupabaseConfigured()) {
        // Return mock inbox if offline
        return [
            { id: 'user-2', name: 'Mert Demir', avatar: 'https://picsum.photos/100?random=2', lastMsg: 'Tamamdır, takas için uygunum.', time: new Date(), unread: 1 }
        ];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch all messages where I am sender or receiver
    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id(full_name, avatar_url),
            receiver:receiver_id(full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Inbox error:", error);
        return [];
    }

    const conversations = new Map();

    messages.forEach((msg: any) => {
        const isMeSender = msg.sender_id === user.id;
        const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
        const otherProfile = isMeSender ? msg.receiver : msg.sender;

        if (!conversations.has(otherId)) {
            conversations.set(otherId, {
                id: otherId,
                name: formatName(otherProfile?.full_name || 'Kullanıcı'),
                avatar: otherProfile?.avatar_url || 'https://picsum.photos/100',
                lastMsg: msg.content,
                time: new Date(msg.created_at),
                unread: 0
            });
        }

        // Count unread if I am the receiver and message is not read
        if (!isMeSender && !msg.is_read) {
            const conv = conversations.get(otherId);
            conv.unread += 1;
        }
    });

    return Array.from(conversations.values());
  },

  getChatHistory: async (otherUserId: string, lastTime?: number): Promise<Message[]> => { 
    if (!isSupabaseConfigured()) {
        // Return mock messages if offline
        return MOCK_MESSAGES;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

    if (lastTime) {
        query = query.gt('created_at', new Date(lastTime).toISOString());
    }

    const { data, error } = await query;
    if (error) return [];

    return data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        createdAt: new Date(msg.created_at).getTime(),
        isRead: msg.is_read
    }));
  },

  markAsRead: async (otherUserId: string) => {
      if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
      }
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    if (!isSupabaseConfigured()) {
        const fakeMsg = {
            id: `local-${Date.now()}`,
            senderId: 'current-user',
            receiverId: receiverId,
            content: content,
            createdAt: Date.now(),
            isRead: false
        };
        MOCK_MESSAGES.push(fakeMsg);
        return fakeMsg;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content
        })
        .select()
        .single();
    
    if (error) throw error;

    return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: data.content,
        createdAt: new Date(data.created_at).getTime(),
        isRead: false
    };
  },

  // --- Channel / Room Messaging ---
  getChannels: async (): Promise<ChatChannel[]> => { 
    return [
      { id: 'general', name: '#Genel', description: 'Genel sohbet odası', usersOnline: 142 },
      { id: 'support', name: '#Yardım', description: 'Uygulama hakkında sorular', usersOnline: 5 },
      { id: 'market', name: '#Pazar', description: 'Takas ilanları hakkında', usersOnline: 24 }
    ]; 
  },

  getChannelMessages: async (channelId: string): Promise<ChannelMessage[]> => {
    if (!isSupabaseConfigured()) return [
        { id: '1', channelId: 'general', senderId: 'user-2', senderName: 'Mert', senderAvatar: 'https://picsum.photos/100?random=2', content: 'Selamlar herkese!', createdAt: new Date().toISOString() }
    ];
    
    const { data, error } = await supabase
        .from('channel_messages')
        .select(`
            *,
            sender:sender_id(full_name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        console.error("Channel msg error:", error);
        return [];
    }

    return data.map((msg: any) => ({
        id: msg.id,
        channelId: msg.channel_id,
        senderId: msg.sender_id,
        senderName: formatName(msg.sender?.full_name),
        senderAvatar: msg.sender?.avatar_url || 'https://picsum.photos/100',
        content: msg.content,
        createdAt: msg.created_at
    }));
  },

  sendChannelMessage: async (channelId: string, content: string) => {
      if (!isSupabaseConfigured()) {
          console.log("Offline channel message sent");
          return {};
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login required");

      const { error } = await supabase.from('channel_messages').insert({
          channel_id: channelId,
          sender_id: user.id,
          content
      });
      
      if (error) throw error;
      return {};
  }
};

// --- Swap Service ---

// HYBRID IMPLEMENTATION - Mock Fallback enabled for reliability
const MOCK_LISTINGS: SwapListing[] = [
  {
    id: '1',
    title: 'Sony WH-1000XM4 Kulaklık',
    description: 'Çok az kullanıldı, kutusu duruyor. Yemek kartı bakiyesi ile takas olur.',
    requiredBalance: 5000,
    photoUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80',
    location: 'Kadıköy',
    ownerId: 'user-2',
    ownerName: 'Mert Demir',
    ownerAvatar: 'https://picsum.photos/100?random=2',
    createdAt: new Date().toISOString()
  },
  {
     id: '2',
     title: 'Zara Hediye Çeki',
     description: '2000 TL değerinde hediye çeki. 1500 TL yemek kartına verilir.',
     requiredBalance: 1500,
     photoUrl: 'https://images.unsplash.com/photo-1556742046-63b11574043b?w=500&q=80',
     location: 'Beşiktaş',
     ownerId: 'user-3',
     ownerName: 'Ayşe Yılmaz',
     ownerAvatar: 'https://picsum.photos/100?random=3',
     createdAt: new Date().toISOString()
  }
];

export const SwapService = {

  getListings: async (): Promise<SwapListing[]> => {
    // If Supabase is configured, try to fetch real data
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('swap_listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                return data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    requiredBalance: item.required_balance,
                    photoUrl: item.photo_url || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=60',
                    location: item.location || 'İstanbul',
                    ownerId: item.owner_id,
                    ownerName: item.owner_name || 'Kullanıcı',
                    ownerAvatar: item.owner_avatar || 'https://picsum.photos/200',
                    createdAt: item.created_at
                }));
            }
        } catch (e) {
            console.error("Supabase fetch error, falling back to mock:", e);
        }
    }
    
    // Fallback to Mock Data if offline or empty (for demo purposes)
    return MOCK_LISTINGS;
  },

  getListingById: async (id: string): Promise<SwapListing | null> => {
     let realData: SwapListing | null = null;

     if (isSupabaseConfigured()) {
         try {
             const { data, error } = await supabase
                 .from('swap_listings')
                 .select('*')
                 .eq('id', id)
                 .single();
             
             if (data && !error) {
                 realData = {
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

     if (realData) return realData;
     return MOCK_LISTINGS.find(l => l.id === id) || null;
  },

  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    if (!isSupabaseConfigured()) {
        const newMock = {
            id: `local-${Date.now()}`,
            title,
            description,
            requiredBalance: price,
            photoUrl,
            location: 'İstanbul',
            ownerId: 'current-user',
            ownerName: 'Ben',
            ownerAvatar: 'https://picsum.photos/200',
            createdAt: new Date().toISOString()
        };
        MOCK_LISTINGS.unshift(newMock);
        return;
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
    
    if (error) throw error;
  },

  deleteListing: async (id: string) => {
      if (isSupabaseConfigured()) {
          await supabase.from('swap_listings').delete().eq('id', id);
      }
      const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
      if (idx !== -1) MOCK_LISTINGS.splice(idx, 1);
  },

  uploadImage: async (file: File): Promise<string> => {
      if (isSupabaseConfigured()) {
          try {
              const fileExt = file.name.split('.').pop();
              const fileName = `swap/${Math.random().toString(36).substring(2)}.${fileExt}`;
              
              const { error } = await withTimeout(
                  supabase.storage.from('images').upload(fileName, file), 
                  8000
              ) as any;
              
              if (error) throw error;
              
              const { data } = supabase.storage.from('images').getPublicUrl(fileName);
              return data.publicUrl;
          } catch (e) {
              console.warn("Resim yükleme hatası (Supabase), base64 deneniyor:", e);
          }
      }
      return await fileToBase64(file);
  }
};


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

// Default empty user for initialization, NOT for display
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
     // Backend should handle rewards in real app
  },
  getLogs: (): RewardLog[] => {
      return [];
  }
};

export const TransactionService = {
  // Local storage fallback mainly for UI state persistence across refresh
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
    if (!isSupabaseConfigured()) return null;

    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        
        if (error) { 
            console.warn("Profile fetch error:", error);
            return null;
        }
        
        if (data) {
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
                wallet: {
                balance: data.wallet_balance || 0,
                totalEarnings: data.total_earnings || 0,
                pendingBalance: 0
                }
            };
        }
    } catch (e) {
        console.error(e);
    }
    return null;
  },

  getUnreadCounts: async (id: string) => {
     if(!isSupabaseConfigured()) return { messages: 0, notifications: 0 };
     
     try {
         const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', id)
            .eq('is_read', false);
         return { messages: count || 0, notifications: 0 };
     } catch {
         return { messages: 0, notifications: 0 };
     }
  },

  getActiveTransaction: async (userId: string): Promise<Transaction | null> => {
    if (!isSupabaseConfigured()) return null;

    try {
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
    } catch (e) {
        console.error("Get Active Tx Error", e);
    }
    return null;
  },

  createTransactionRequest: async (userId: string, amount: number, description: string) => {
     if (!isSupabaseConfigured()) throw new Error("Veritabanı bağlantısı yok");

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
        const { data } = await supabase
            .from('transactions')
            .select(`*, profiles:seeker_id(full_name, avatar_url, rating)`)
            .eq('status', 'waiting-supporter')
            .order('created_at', { ascending: false });
        return data || [];
    } catch {
        return [];
    }
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
    throw new Error("İşlem kabul edilemedi");
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

              const { error: uploadError } = await supabase.storage.from('qr-codes').upload(filePath, file);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(filePath);
              return publicUrl;
          } catch (error) {
              console.warn("Supabase Storage error (QR):", error);
              // If storage fails, we try base64 as last resort but user prefers Supabase
              throw error; 
          }
      }
      throw new Error("Storage not configured");
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

  uploadAvatar: async (file: File) => { 
    if (isSupabaseConfigured()) {
          try {
              const fileExt = file.name.split('.').pop();
              const fileName = `avatars/${Math.random().toString(36).substring(2)}.${fileExt}`;
              
              const { error } = await supabase.storage.from('images').upload(fileName, file);
              
              if (error) throw error;
              
              const { data } = supabase.storage.from('images').getPublicUrl(fileName);
              return data.publicUrl;
          } catch (e) {
              console.warn("Resim yükleme hatası (Supabase):", e);
              throw e;
          }
      }
      throw new Error("Veritabanı bağlı değil");
  },

  // --- Messaging (PURE SUPABASE) ---
  
  // Fetches list of conversations
  getInbox: async (): Promise<{id: string, name: string, avatar: string, lastMsg: string, time: Date, unread: number}[]> => { 
    if (!isSupabaseConfigured()) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(full_name, avatar_url),
                receiver:receiver_id(full_name, avatar_url)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!messages) return [];

        const conversations = new Map();

        messages.forEach((msg: any) => {
            const isMeSender = msg.sender_id === user.id;
            const otherId = isMeSender ? msg.receiver_id : msg.sender_id;
            const otherProfile = isMeSender ? msg.receiver : msg.sender;

            // Only add if not exists, since we ordered by created_at desc, first one is latest
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
    } catch (e) {
        console.error("Inbox fetch failed", e);
        return [];
    }
  },

  getChatHistory: async (otherUserId: string, lastTime?: number): Promise<Message[]> => { 
    if (!isSupabaseConfigured()) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
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
    } catch {
        return [];
    }
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
    if (!isSupabaseConfigured()) throw new Error("Offline");

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
    if (!isSupabaseConfigured()) return [];
    
    try {
        const { data, error } = await supabase
            .from('channel_messages')
            .select(`
                *,
                sender:sender_id(full_name, avatar_url)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        return data.map((msg: any) => ({
            id: msg.id,
            channelId: msg.channel_id,
            senderId: msg.sender_id,
            senderName: formatName(msg.sender?.full_name),
            senderAvatar: msg.sender?.avatar_url || 'https://picsum.photos/100',
            content: msg.content,
            createdAt: msg.created_at
        }));
    } catch {
        return [];
    }
  },

  sendChannelMessage: async (channelId: string, content: string) => {
      if (!isSupabaseConfigured()) throw new Error("Offline");

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

// STRICT SUPABASE IMPLEMENTATION
export const SwapService = {

  getListings: async (): Promise<SwapListing[]> => {
    if (!isSupabaseConfigured()) return [];
    
    try {
        const { data, error } = await supabase
            .from('swap_listings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Listings fetch error", error);
            return [];
        }

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
    } catch (e) {
        console.error("Swap Service Error", e);
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
         
         if (data && !error) {
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
     return null;
  },

  createListing: async (title: string, description: string, price: number, photoUrl: string) => {
    if (!isSupabaseConfigured()) throw new Error("Veritabanı bağlantısı yok");

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
  },

  uploadImage: async (file: File): Promise<string> => {
      if (isSupabaseConfigured()) {
          try {
              const fileExt = file.name.split('.').pop();
              const fileName = `swap/${Math.random().toString(36).substring(2)}.${fileExt}`;
              
              const { error } = await supabase.storage.from('images').upload(fileName, file);
              
              if (error) throw error;
              
              const { data } = supabase.storage.from('images').getPublicUrl(fileName);
              return data.publicUrl;
          } catch (e) {
              console.warn("Resim yükleme hatası:", e);
              throw e;
          }
      }
      throw new Error("Veritabanı bağlantısı yok");
  }
};

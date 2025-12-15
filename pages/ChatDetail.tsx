
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Phone, MoreVertical, Loader2, Check, CheckCheck, MessageCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DBService, Message, User } from '../types';

interface ChatDetailProps {
  overrideUserId?: string; // For split view
  isSplitView?: boolean;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({ overrideUserId, isSplitView = false }) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const userId = overrideUserId || paramUserId;
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastServerTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }, 50);
    }
    if (containerRef.current) {
        setTimeout(() => {
            if(containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }, 50);
    }
  };

  useLayoutEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, userId]);

  const fetchNewMessages = useCallback(async () => {
    if (!userId || !currentUser || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    try {
        const lastTime = lastServerTimeRef.current;
        const newMsgs = await DBService.getChatHistory(userId, lastTime);

        if (newMsgs.length > 0) {
            const latestMsg = newMsgs[newMsgs.length - 1];
            // Only update time if newer
            if (latestMsg.createdAt > lastServerTimeRef.current) {
                lastServerTimeRef.current = latestMsg.createdAt;
            }

            setMessages(prev => {
                const incoming = newMsgs.filter(nm => !prev.some(pm => pm.id === nm.id));
                if (incoming.length === 0) return prev;
                return [...prev, ...incoming].sort((a, b) => a.createdAt - b.createdAt);
            });
            
            const hasIncoming = newMsgs.some(m => m.senderId === userId);
            if (hasIncoming) {
                await DBService.markAsRead(userId);
            }
        }
    } catch (e) {
        console.error("Poll error", e);
    } finally {
        isFetchingRef.current = false;
    }
  }, [userId, currentUser]);

  useEffect(() => {
    setLoading(true);
    let pollingInterval: any = null;

    const initChat = async () => {
      let myId = '';
      if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return; 
          myId = user.id;
          setCurrentUser(user.id);
      } else {
          // If not configured, we can't chat really, but let's handle graceful fail
          setLoading(false);
          return;
      }

      if (!userId) return;

      try {
        const [profile, history] = await Promise.all([
          DBService.getUserProfile(userId),
          DBService.getChatHistory(userId)
        ]);
        
        setOtherUser(profile);
        setMessages(history);
        
        if(history.length > 0) {
            lastServerTimeRef.current = history[history.length - 1].createdAt;
        }

        setLoading(false);
        setTimeout(() => scrollToBottom('auto'), 100);
        await DBService.markAsRead(userId);

      } catch (error) {
        console.error("Chat init error:", error);
        setLoading(false);
      }

      pollingInterval = setInterval(() => {
          if (!document.hidden) {
              fetchNewMessages();
          }
      }, 4000); // Poll slightly slower to reduce DB load
    };

    initChat();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [userId]); // Removed fetchNewMessages from dependency to prevent loop reset

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !userId || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage(''); 
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
        id: tempId,
        senderId: currentUser,
        receiverId: userId,
        content: content,
        createdAt: Date.now(),
        isRead: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom('smooth');
    
    try {
      const realMsg = await DBService.sendMessage(userId, content);
      
      setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
      
      if (realMsg.createdAt > lastServerTimeRef.current) {
          lastServerTimeRef.current = realMsg.createdAt;
      }

    } catch (error) {
      alert("Mesaj gönderilemedi. Veritabanı hatası.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
    }
  };

  if (!userId) {
     return (
        <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400">
           <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Sohbet seçin</p>
           </div>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center bg-white">
           <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
     );
  }

  return (
    <div className={`flex flex-col h-full bg-[#efeae2] relative overflow-hidden ${isSplitView ? 'border-l border-gray-200' : ''}`}>
      
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-30 shrink-0 border-b border-gray-100">
         <div className="flex items-center gap-3">
            {!isSplitView && (
                <button onClick={() => navigate('/messages')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
                   <ChevronLeft size={24} className="text-gray-600"/>
                </button>
            )}
            <div className="flex items-center gap-3 cursor-pointer">
               <div className="relative">
                  <img src={otherUser?.avatar || 'https://picsum.photos/100'} alt="User" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{otherUser?.name || 'Kullanıcı'}</h3>
                  <p className="text-[10px] text-gray-500">Çevrimiçi</p>
               </div>
            </div>
         </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth overscroll-contain relative min-h-0 bg-[url('https://site-assets.fontawesome.com/releases/v6.5.1/svgs/solid/message-lines.svg')] bg-opacity-5"
      >
         {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60 select-none pb-20">
               <div className="bg-white/50 p-4 rounded-full mb-3">
                  <Send size={24} className="text-gray-400" />
               </div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sohbet Başladı</p>
            </div>
         )}
         
         {messages.map((msg) => {
            const isMe = msg.senderId === currentUser;
            const isTemp = msg.id.startsWith('temp-');
            return (
               <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in relative z-10`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm relative break-words leading-relaxed ${
                     isMe 
                     ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' 
                     : 'bg-white text-gray-800 rounded-tl-none'
                  } ${isTemp ? 'opacity-70' : 'opacity-100'}`}>
                     <p>{msg.content}</p>
                     <div className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 text-gray-400`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {isMe && (
                             isTemp ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={12} className="text-blue-500" />
                        )}
                     </div>
                  </div>
               </div>
            );
         })}
         <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] p-3 pb-safe flex items-center gap-2 shrink-0 z-30">
         <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Bir mesaj yaz..."
            className="flex-1 bg-white rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900/10 transition-all text-gray-800 placeholder:text-gray-400 border border-transparent focus:border-gray-200"
         />
         <button 
            onClick={() => handleSend()}
            disabled={!newMessage.trim()}
            className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <Send size={20} className="ml-0.5" />
         </button>
      </div>
    </div>
  );
};


import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Send, ChevronLeft, Users, MessageSquare, Menu } from 'lucide-react';
import { DBService, ChatChannel, ChannelMessage, ReferralService } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ChatRooms: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // Start open on mobile if no channel selected
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = ReferralService.getUserProfile();

  // Load Channels
  useEffect(() => {
    const loadChannels = async () => {
      const data = await DBService.getChannels();
      setChannels(data);
      
      // If we have a channelId from URL, select it
      if (channelId) {
          const found = data.find(c => c.id === channelId);
          if (found) {
              setActiveChannel(found);
              setIsMobileMenuOpen(false);
          } else if (data.length > 0) {
              // Redirect to first channel if id invalid
              navigate(`/chatrooms/${data[0].id}`);
          }
      } else if (data.length > 0) {
          // Default to first channel
          navigate(`/chatrooms/${data[0].id}`);
      }
      setLoading(false);
    };
    loadChannels();
  }, [channelId, navigate]);

  // Load Messages & Subscription
  useEffect(() => {
      if (!activeChannel) return;

      const loadMessages = async () => {
          const msgs = await DBService.getChannelMessages(activeChannel.id);
          setMessages(msgs);
          scrollToBottom('auto');
      };
      loadMessages();

      // Realtime Subscription
      let channelSub: any;
      if (isSupabaseConfigured()) {
          channelSub = supabase.channel(`public:channel_messages:channel_id=eq.${activeChannel.id}`)
              .on('postgres_changes', { 
                  event: 'INSERT', 
                  schema: 'public', 
                  table: 'channel_messages',
                  filter: `channel_id=eq.${activeChannel.id}`
              }, async (payload) => {
                  const newMsgRow = payload.new;
                  // We need to fetch sender details as the realtime payload only has FKs usually
                  // For optimized apps, you'd send this data in payload, but for now we re-fetch or assume
                  // Ideally we fetch the single message with profile join.
                  
                  // For demo/simplicity, we just assume or quick fetch if possible, 
                  // or just append if we trust the payload structure matches.
                  // Since we defined ChannelMessage with senderName, we might be missing it in raw payload.
                  // Let's do a quick hack: fetch the fresh message list or just this message.
                  const freshMsgs = await DBService.getChannelMessages(activeChannel.id);
                  setMessages(freshMsgs);
                  scrollToBottom('smooth');
              })
              .subscribe();
      }

      return () => {
          if (channelSub) supabase.removeChannel(channelSub);
      };
  }, [activeChannel]);

  const scrollToBottom = (behavior: ScrollBehavior) => {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || !activeChannel) return;

      const content = newMessage.trim();
      setNewMessage('');

      // Optimistic Update
      const optimisticMsg: ChannelMessage = {
          id: `temp-${Date.now()}`,
          channelId: activeChannel.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          content: content,
          createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom('smooth');

      try {
          await DBService.sendChannelMessage(activeChannel.id, content);
          // If using realtime, the real message comes back and replaces/deduplicates usually
          // But for mock/local, we just leave it.
          if (!isSupabaseConfigured()) {
             // Keep it
          } else {
             // In real DB scenario, subscription updates it.
          }
      } catch (error) {
          console.error(error);
          // Revert on failure
      }
  };

  const handleChannelSelect = (channel: ChatChannel) => {
      navigate(`/chatrooms/${channel.id}`);
      setActiveChannel(channel);
      setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-40px)] bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden flex flex-col md:flex-row text-slate-100">
      
      {/* Sidebar (Channels List) */}
      <div className={`
         w-full md:w-64 bg-slate-950 flex flex-col border-r border-slate-800 transition-all duration-300 absolute md:relative z-20 h-full
         ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
             <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                <MessageSquare className="text-emerald-500" size={20} />
                Odalar
             </h2>
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400">
                <ChevronLeft />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {loading ? (
                 <div className="text-center p-4 text-slate-500 text-xs">Odalar yükleniyor...</div>
             ) : (
                 channels.map(channel => (
                     <button
                        key={channel.id}
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all
                            ${activeChannel?.id === channel.id 
                                ? 'bg-slate-800 text-emerald-400 shadow-md shadow-black/20' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                     >
                        <div className="flex items-center gap-2">
                            <Hash size={18} className={activeChannel?.id === channel.id ? 'opacity-100' : 'opacity-50'} />
                            <span className="font-bold text-sm tracking-wide">{channel.name.replace('#', '')}</span>
                        </div>
                        <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 group-hover:text-slate-300">
                            {channel.usersOnline}
                        </span>
                     </button>
                 ))
             )}
          </div>
          
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Topluluk Kurallarına Uygun Sohbet Ediniz.
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 relative h-full">
         
         {/* Mobile Header Overlay Trigger */}
         <div className="md:hidden flex items-center p-4 bg-slate-900 border-b border-slate-800 z-10">
             <button onClick={() => setIsMobileMenuOpen(true)} className="mr-3 text-slate-400">
                 <Menu size={24} />
             </button>
             <div>
                 <h3 className="font-bold text-white">{activeChannel?.name}</h3>
                 <p className="text-[10px] text-slate-400">{activeChannel?.description}</p>
             </div>
         </div>

         {/* Desktop Header */}
         <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
             <div>
                 <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    {activeChannel?.name}
                 </h3>
                 <p className="text-xs text-slate-400">{activeChannel?.description}</p>
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                 <Users size={14} className="text-emerald-500" />
                 <span>{activeChannel?.usersOnline} Çevrimiçi</span>
             </div>
         </div>

         {/* Messages List */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
             {messages.map((msg, index) => {
                 const isMe = msg.senderId === currentUser.id;
                 const showHeader = index === 0 || messages[index-1].senderId !== msg.senderId;
                 
                 return (
                     <div key={msg.id} className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-fade-in`}>
                         {showHeader ? (
                             <img src={msg.senderAvatar} className="w-8 h-8 rounded-full bg-slate-800 object-cover mt-1" alt={msg.senderName} />
                         ) : (
                             <div className="w-8 h-8 shrink-0"></div>
                         )}
                         
                         <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                             {showHeader && (
                                 <span className={`text-[10px] font-bold mb-1 ml-1 ${isMe ? 'text-emerald-400' : 'text-slate-400'}`}>
                                     {msg.senderName}
                                 </span>
                             )}
                             <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                                 isMe 
                                 ? 'bg-emerald-600 text-white rounded-tr-none' 
                                 : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                             }`}>
                                 {msg.content}
                             </div>
                             <span className="text-[9px] text-slate-600 mt-1 px-1">
                                 {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                         </div>
                     </div>
                 );
             })}
             <div ref={messagesEndRef} className="h-2"></div>
         </div>

         {/* Input Area */}
         <div className="p-4 bg-slate-900 border-t border-slate-800">
             <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 focus-within:border-emerald-500/50 transition-colors"
             >
                 <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`#${activeChannel?.name.replace('#','')} kanalına mesaj yaz...`}
                    className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-500 outline-none"
                 />
                 <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     <Send size={18} />
                 </button>
             </form>
         </div>

      </div>
    </div>
  );
};

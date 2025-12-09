import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DBService } from '../types';
import { Loader2, MessageSquareOff, ChevronLeft, Search } from 'lucide-react';
import { ChatDetail } from './ChatDetail';

interface InboxItem {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: Date;
  unread: number;
}

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Check for desktop view width to enable split view
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadInbox = async () => {
      setLoading(true);
      try {
        const data = await DBService.getInbox();
        setInbox(data);
      } catch (error) {
        console.error("Gelen kutusu yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInbox();
  }, [userId]); // Reload inbox when chat changes to update read status/order

  const formatTime = (date: Date) => {
    try {
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const filteredInbox = inbox.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If on mobile and a userId is selected, show only ChatDetail
  if (!isDesktop && userId) {
      return <ChatDetail />;
  }

  return (
    <div className={`h-[calc(100vh-140px)] md:h-[calc(100vh-40px)] bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex`}>
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 flex flex-col border-r border-gray-100 ${userId && !isDesktop ? 'hidden' : 'block'}`}>
          <div className="p-4 border-b border-gray-100 bg-white z-10">
             <div className="flex items-center gap-2 mb-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors md:hidden">
                   <ChevronLeft size={20} className="text-gray-600"/>
                </button>
                <h1 className="text-xl font-bold text-gray-800">Mesajlar</h1>
             </div>
             
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Sohbet ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:bg-white focus:border-slate-300 transition-all"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <Loader2 className="animate-spin text-primary mb-2" size={24} />
                   <p className="text-xs">Yükleniyor...</p>
                </div>
             ) : filteredInbox.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <MessageSquareOff size={24} className="opacity-40" />
                   </div>
                   <p className="font-bold text-gray-500 text-sm">Mesajınız yok</p>
                </div>
             ) : (
                filteredInbox.map(chat => (
                   <div 
                      key={chat.id} 
                      onClick={() => navigate(`/messages/${chat.id}`)}
                      className={`p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0
                        ${userId === chat.id ? 'bg-slate-50 border-r-4 border-r-slate-900' : ''}`}
                   >
                      <div className="relative">
                         <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                         {chat.unread > 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-1">
                            <h4 className={`text-sm ${chat.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{chat.name}</h4>
                            <span className={`text-[10px] ${chat.unread > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{formatTime(chat.time)}</span>
                         </div>
                         <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {chat.lastMsg}
                         </p>
                      </div>
                   </div>
                ))
             )}
          </div>
      </div>

      {/* Detail View (Visible on Desktop always, or Mobile if selected) */}
      <div className={`flex-1 bg-gray-50 h-full ${!userId && !isDesktop ? 'hidden' : 'block'}`}>
         {userId ? (
            <ChatDetail overrideUserId={userId} isSplitView={isDesktop} />
         ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 flex-col">
               <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <MessageSquareOff size={32} className="opacity-40" />
               </div>
               <p className="text-sm font-medium">Görüntülemek için bir sohbet seçin</p>
            </div>
         )}
      </div>

    </div>
  );
};
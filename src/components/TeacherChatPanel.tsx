import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  created: string;
}

const TeacherChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      let adminId = null;
      // Decode token to get user role
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'teacher') {
            // Fetch admin id from backend
            const resAdmin = await fetch('/api/teachers');
            const users = await resAdmin.json();
            const admin = Array.isArray(users) ? users.find(u => u.role === 'admin') : null;
            if (admin) adminId = admin.id;
          }
        } catch {}
      }
      if (!adminId) return setMessages([]);
  const res = await fetch(`/api/messages?withUser=${adminId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      toast.error('Failed to fetch messages');
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
  const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newMessage }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded shadow p-4 flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto mb-2 border rounded p-2 bg-gray-50">
        {messages.length === 0 && <div className="text-gray-400 text-center">No messages yet.</div>}
        {messages.map((msg) => {
          // Get current user id from token
          let myId = '';
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              myId = payload.id?.toString() || '';
            } catch {}
          }
          const isMine = msg.senderId?.toString() === myId;
          return (
            <div
              key={msg.id}
              className={`mb-2 text-sm flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-3 py-2 rounded-2xl shadow text-xs relative ${isMine ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {isMine ? 'You' : 'A'}
                  </span>
                  <span className="font-semibold text-xs">{isMine ? 'You' : 'Admin'}</span>
                </div>
                <div>{msg.content}</div>
                <div className="text-[10px] text-gray-300 mt-1 text-right">{new Date(msg.created).toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form className="flex gap-1 items-center relative" onSubmit={handleSend}>
        <button type="button" onClick={() => setShowEmoji((v) => !v)} className="px-2 py-1 rounded bg-gray-200">😊</button>
        {showEmoji && (
          <div className="absolute bottom-10 left-0 z-10">
            <Picker data={data} onEmojiSelect={(e: any) => setNewMessage((m) => m + (e.native || e.colons || ''))} />
          </div>
        )}
        <input
          className="flex-1 border rounded px-2 py-1"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default TeacherChatPanel;


import React, { useState, useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Button } from '@/components/ui/button';
import { User, Paperclip } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  created: string;
  resourceUrl?: string;
  resourceName?: string;
}

interface ChatPanelProps {
  teachers: Teacher[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({ teachers }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
  let url = '/api/messages';
      if (selectedRecipient !== 'all') {
        url += `?withUser=${selectedRecipient}`;
      }
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [selectedRecipient]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !resource) return;
    setSending(true);
    try {
      let resourceUrl = undefined;
      let resourceName = undefined;
      if (resource) {
        // Simulate upload (replace with real upload logic)
        resourceUrl = URL.createObjectURL(resource);
        resourceName = resource.name;
      }
      const token = localStorage.getItem("token");
  const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: message,
          recipientId: selectedRecipient === 'all' ? undefined : selectedRecipient,
          broadcast: selectedRecipient === 'all',
          resourceUrl,
          resourceName,
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      setMessage('');
      setResource(null);
      // Optionally, refresh messages
  fetch('/api/messages', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []));
    } catch (err) {
      // handle error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-3 w-full max-w-sm ml-0 mb-8 border border-gray-100">
      <h2 className="text-base font-bold mb-2 flex items-center gap-2 text-blue-700"><User className="mr-1" />Live Chat with Staff</h2>
      <div className="flex items-center mb-2 gap-2">
        <label className="font-medium text-gray-600 text-xs">Send to:</label>
        <select
          className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-300"
          value={selectedRecipient}
          onChange={e => setSelectedRecipient(e.target.value)}
        >
          <option value="all">All Staff</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
          ))}
        </select>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-2 h-64 overflow-y-auto mb-2 flex flex-col border border-gray-100">
        {loading ? (
          <div className="text-gray-400 text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400 text-center">No messages yet.</div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`mb-1 flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-3 py-2 rounded-2xl shadow text-xs relative ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {msg.sender === 'admin' ? 'A' : (msg.sender[0] || 'U').toUpperCase()}
                  </span>
                  <span className="font-semibold text-xs">{msg.sender === 'admin' ? 'You' : msg.sender}</span>
                </div>
                <div>{msg.content}</div>
                {msg.resourceUrl && msg.resourceName && (
                  <div className="mt-2 flex items-center gap-1">
                    <Paperclip className="w-4 h-4 text-blue-400" />
                    <a href={msg.resourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-200 hover:text-blue-100 text-xs">{msg.resourceName}</a>
                  </div>
                )}
                <div className="text-[10px] text-gray-300 mt-1 text-right">{new Date(msg.created).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="flex gap-1 items-center relative" onSubmit={handleSend}>
        <button
          type="button"
          className="text-xl px-2 py-1 rounded-full hover:bg-blue-50 focus:outline-none"
          onClick={() => setShowEmoji(v => !v)}
          tabIndex={-1}
        >
          😊
        </button>
        {showEmoji && (
          <div className="absolute bottom-12 left-0 z-50">
            <Picker data={data} onEmojiSelect={e => { setMessage(m => m + (e.native || e.shortcodes || '')); setShowEmoji(false); }} theme="light" previewPosition="none" searchPosition="none" perLine={8} maxFrequentRows={1} />
          </div>
        )}
        <input
          className="flex-1 border rounded-full px-3 py-2 text-xs focus:ring-2 focus:ring-blue-300"
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={sending}
        />
        <label className="cursor-pointer flex items-center gap-1 text-blue-600 hover:text-blue-800">
          <Paperclip className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            onChange={e => setResource(e.target.files?.[0] || null)}
            disabled={sending}
          />
        </label>
        <Button type="submit" disabled={sending || (!message.trim() && !resource)} className="bg-blue-600 text-white rounded-full px-4 py-1 text-xs">
          {sending ? '...' : 'Send'}
        </Button>
      </form>
      {resource && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          {resource.name}
          <button type="button" className="ml-2 text-red-400 hover:text-red-600" onClick={() => setResource(null)}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;

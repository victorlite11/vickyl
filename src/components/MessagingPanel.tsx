import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const MessagingPanel = ({ token, teachers }) => {
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [broadcast, setBroadcast] = useState(false);
  const [sent, setSent] = useState(false);
  // Always update recipientId if teachers change and not broadcasting
  useEffect(() => {
    if (!broadcast && teachers.length > 0 && !recipientId) {
      setRecipientId(teachers[0].id);
    }
  }, [teachers, broadcast]);

  const sendMessage = async () => {
    if (!message.trim()) return toast.error('Message cannot be empty');
    try {
  await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: message, recipientId: broadcast ? undefined : recipientId, broadcast })
      });
      setMessage('');
      setSent(true);
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="p-4 border rounded mb-6 bg-white shadow-lg max-w-lg mx-auto">
      <h3 className="font-bold mb-4 text-lg text-green-700 flex items-center"><span className="material-icons mr-2">chat</span>Send Message to Teachers</h3>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} />
            <span className="text-sm">Broadcast to all</span>
          </label>
          {!broadcast && (
            <select value={recipientId} onChange={e => setRecipientId(e.target.value)} className="border rounded px-2 py-1">
              {teachers.length === 0 ? (
                <option value="">No teachers found</option>
              ) : (
                teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))
              )}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <textarea
            className="border rounded w-full p-2 text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-400 transition"
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <Button onClick={sendMessage} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full shadow-lg">Send</Button>
        </div>
        {sent && <div className="text-green-600 mt-2 text-center">Message sent!</div>}
      </div>
    </div>
  );
};

export default MessagingPanel;

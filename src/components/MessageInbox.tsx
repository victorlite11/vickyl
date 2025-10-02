import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const MessageInbox = ({ token }) => {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
  fetch('/api/messages', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setMessages(data) : setMessages([]))
      .catch(() => setMessages([]));
  }, [token]);

  return (
    <div className="p-4 border rounded mb-6 bg-white shadow-lg max-w-lg mx-auto">
      <h3 className="font-bold mb-4 text-lg text-blue-700 flex items-center">
        <span className="material-icons mr-2">mail</span>
        Inbox
      </h3>
      {messages.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No messages yet.</div>
      ) : (
        <ul className="space-y-4">
          {messages.map(msg => (
            <li key={msg.id} className="rounded-lg bg-blue-50 p-4 shadow flex flex-col">
              <div className="text-base text-gray-800 mb-2">{msg.content}</div>
              <div className="text-xs text-gray-500 self-end">Received: {msg.created}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MessageInbox;

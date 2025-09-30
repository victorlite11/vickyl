import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Stop any previous speech before starting new
    window.speechSynthesis.cancel();
    const msg = new window.SpeechSynthesisUtterance(
      'Signup, work smart, intelligently and save time. Brought to you by Creative Mind Technology.'
    );
    msg.rate = 0.8;
    msg.volume = 1;
    msg.pitch = 1;
    window.speechSynthesis.speak(msg);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Login successful!');
        window.speechSynthesis.cancel();
        const msg = new window.SpeechSynthesisUtterance(
          'You are welcome to the working smart platform.'
        );
        msg.rate = 0.8;
        msg.volume = 1;
        msg.pitch = 1;
        window.speechSynthesis.speak(msg);
        onLogin(data);
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 border rounded-xl max-w-lg mx-auto mt-12 bg-white shadow-2xl flex flex-col items-center">
      <h2 className="text-3xl font-extrabold mb-2 text-blue-700 text-center">Login to Start Working Smart</h2>
      <p className="mb-6 text-gray-500 text-center">Sign in to your account and join the smart, intelligent, time-saving platform.</p>
      <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-4 text-lg py-3" />
      <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="mb-4 text-lg py-3" />
      <Button onClick={handleLogin} disabled={loading} className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg">Login</Button>
    </div>
  );
};

export default Login;

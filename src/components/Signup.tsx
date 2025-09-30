import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Signup = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.speechSynthesis.cancel();
    const msg = new window.SpeechSynthesisUtterance(
      'Signup, work smart, intelligently and save time. Brought to you by Creative Mind Technology.'
    );
    msg.rate = 0.8;
    msg.volume = 1;
    msg.pitch = 1;
    window.speechSynthesis.speak(msg);
  }, []);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Signup successful!');
        window.speechSynthesis.cancel();
        const msg = new window.SpeechSynthesisUtterance(
          'You are welcome to the working smart platform.'
        );
        msg.rate = 0.8;
        msg.volume = 1;
        msg.pitch = 1;
        window.speechSynthesis.speak(msg);
        onSignup(data);
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch {
      toast.error('Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 border rounded-xl max-w-lg mx-auto mt-12 bg-white shadow-2xl flex flex-col items-center">
      <h2 className="text-3xl font-extrabold mb-2 text-green-700 text-center">Signup to Start Working Smart</h2>
      <p className="mb-6 text-gray-500 text-center">Create your account and join the smart, intelligent, time-saving platform.</p>
      <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="mb-4 text-lg py-3" />
      <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="mb-4 text-lg py-3" />
      <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="mb-4 text-lg py-3" />
      <select value={role} onChange={e => setRole(e.target.value)} className="border rounded px-3 py-2 mb-4 w-full text-lg">
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
      <Button onClick={handleSignup} disabled={loading} className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 rounded-full shadow-lg">Sign Up</Button>
    </div>
  );
};

export default Signup;

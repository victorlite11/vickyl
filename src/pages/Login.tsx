import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Remove all logic and just export null to disable the Login page
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  React.useEffect(() => {
    const msg = new window.SpeechSynthesisUtterance('Please login to access your dashboard.');
    window.speechSynthesis.speak(msg);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Decode JWT to get role
        let role = '';
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          role = payload.role;
        } catch {}
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-6 text-green-700">Login</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2 w-full mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-3 py-2 w-full mb-6"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">Login</Button>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-blue-600 hover:underline">Don't have an account? Signup</Link>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-green-600 hover:underline">Back to Dashboard</Link>
        </div>
      </form>
    </div>
  );
}

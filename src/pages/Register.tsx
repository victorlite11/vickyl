import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Remove all logic and just export null to disable the Register page
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  React.useEffect(() => {
    const msg = new window.SpeechSynthesisUtterance('Signup to join Lesson Spark Educator Hub.');
    window.speechSynthesis.speak(msg);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
  const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleRegister}>
        <h2 className="text-2xl font-bold mb-6 text-green-700">Signup</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input
          type="text"
          placeholder="Name"
          className="border rounded px-3 py-2 w-full mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
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
        <select
          className="border rounded px-3 py-2 w-full mb-6"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">Signup</Button>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">Already have an account? Login</Link>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-green-600 hover:underline">Back to Dashboard</Link>
        </div>
      </form>
    </div>
  );
}

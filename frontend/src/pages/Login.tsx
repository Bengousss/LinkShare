import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:3001/auth/login', {
        username,
        password,
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      navigate('/events');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-gray-100 rounded shadow-md">
        <h1 className="text-xl mb-4">Login</h1>

        <input
          type="text"
          placeholder="Username"
          className="mb-2 p-2 border w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-2 p-2 border w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Login
        </button>
        <p className="mt-4 text-sm text-center">
          Pas de compte ?{' '}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate('/register')}
          >
            S’inscrire
          </span>
        </p>
      </form>
    </div>
  );
}
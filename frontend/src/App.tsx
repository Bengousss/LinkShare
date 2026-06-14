import { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import Catalog from './pages/Catalog';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import './App.css';

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole]   = useState<string | null>(localStorage.getItem('role'));

  const login = (newToken: string, newRole: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/events"    element={<PrivateRoute><Events /></PrivateRoute>} />
          <Route path="/catalog"   element={<PrivateRoute><Catalog /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/calendar"  element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to={token ? '/events' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
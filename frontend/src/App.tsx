import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import './App.css';

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null, role: null,
  login: () => {}, logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem('role')
  );

  const login = (t: string, r: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('role', r);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/auth/login', { username, password });
      localStorage.setItem('username', res.data.username);
      login(res.data.token, res.data.role);
      navigate('/events');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>LinkShare</span>
        </div>
        <h1 className={styles.tagline}>
          Coordonnez vos<br />bénévoles, simplement.
        </h1>
        <p className={styles.sub}>
          Gérez vos événements, votre matériel et votre équipe
          depuis une seule interface conçue pour les associations.
        </p>
        <div className={styles.features}>
          {['Gestion des bénévoles', "Planification d'événements", 'Suivi du matériel'].map(f => (
            <div key={f} className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.right}>
        <form onSubmit={handleSubmit} className={`${styles.form} fade-up`}>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Connexion</h2>
            <p className={styles.formSub}>Bon retour ! Entrez vos identifiants.</p>
          </div>

          {error && (
            <div className={`${styles.errorBox} fade-in`}>
              <span>⚠</span> {error}
            </div>
          )}

          <div className={`input-group ${styles.fieldGroup}`}>
            <label>Nom d'utilisateur</label>
            <input
              className={`input ${error ? 'error' : ''}`}
              type="text"
              placeholder="admin"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          <div className={`input-group ${styles.fieldGroupLast}`}>
            <label>Mot de passe</label>
            <input
              className={`input ${error ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading && <span className="spinner" />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className={styles.footer}>
            Pas encore de compte ?{' '}
            <Link to="/register" className={styles.link}>S'inscrire</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
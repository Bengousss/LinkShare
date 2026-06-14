import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Register.module.css';

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const pwdStrength = () => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 6)    score++;
    if (password.length >= 10)   score++;
    if (/[A-Z]/.test(password))  score++;
    if (/[0-9]/.test(password))  score++;
    return score;
  };
  const strength      = pwdStrength();
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][strength];
  const strengthColor = ['', 'var(--danger)', 'var(--warning)', 'var(--primary)', 'var(--success)'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password)   { setError('Tous les champs sont requis.');                          return; }
    if (username.length < 3)      { setError("Le nom d'utilisateur doit faire au moins 3 caractères."); return; }
    if (password.length < 6)      { setError('Le mot de passe doit faire au moins 6 caractères.');      return; }
    if (password !== confirm)     { setError('Les mots de passe ne correspondent pas.');                return; }

    setLoading(true);
    try {
      await axios.post('http://localhost:3001/auth/register', { username, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={`${styles.successCard} fade-up`}>
          <div className={styles.successIcon}>✓</div>
          <h2 style={{ marginBottom: 8 }}>Compte créé !</h2>
          <p style={{ color: 'var(--text-2)' }}>Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit} className={`${styles.form} fade-up`}>
        <Link to="/login" className={styles.backLink}>← Retour à la connexion</Link>
        <div className={styles.brandRow}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>LinkShare</span>
        </div>

        <h2 className={styles.formTitle}>Créer un compte</h2>
        <p className={styles.formSub}>Rejoignez la plateforme en tant que bénévole.</p>

        {error && (
          <div className={`${styles.errorBox} fade-in`}>
            <span>⚠</span> {error}
          </div>
        )}
        <div className={`input-group ${styles.fieldGroup}`}>
          <label>Nom d'utilisateur</label>
          <input
            className="input"
            type="text"
            placeholder="marie.dupont"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
          />
          {username.length > 0 && username.length < 3 && (
            <span className={styles.fieldHint}>3 caractères minimum</span>
          )}
        </div>
        <div className={`input-group ${styles.fieldGroup}`}>
          <label>Mot de passe</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
          />
        </div>
        {password.length > 0 && (
          <div className={styles.fieldGroup}>
            <div className={styles.strengthBar}>
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className={styles.strengthSegment}
                  style={{ background: n <= strength ? strengthColor : 'var(--border)' }}
                />
              ))}
            </div>
            <span className={styles.strengthLabel} style={{ color: strengthColor }}>
              {strengthLabel}
            </span>
          </div>
        )}
        <div className={`input-group ${styles.fieldGroupLast}`}>
          <label>Confirmer le mot de passe</label>
          <input
            className={`input ${confirm && confirm !== password ? 'error' : ''}`}
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
          />
          {confirm && confirm !== password && (
            <span className={styles.fieldHint}>Les mots de passe ne correspondent pas</span>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
        <p className={styles.footer}>
          Déjà un compte ?{' '}
          <Link to="/login" className={styles.link}>Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
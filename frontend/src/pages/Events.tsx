import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import styles from './Events.module.css';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface Registration {
  event_id: number;
  status: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function Events() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  const [events,        setEvents]        = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState<Toast | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [date,        setDate]        = useState('');
  const [formError,   setFormError]   = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get<Event[]>('http://localhost:3001/events', config);
      setEvents(res.data);
    } catch {
      showToast('Impossible de charger les événements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchRegistrations = useCallback(async () => {
    if (role !== 'Bénévole') return;
    try {
      const res = await axios.get<Registration[]>('http://localhost:3001/registrations/mine', config);
      setRegistrations(res.data);
    } catch {}
  }, [token, role]);

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, [fetchEvents, fetchRegistrations]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !description.trim() || !date) {
      setFormError('Tous les champs sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post<Event>(
        'http://localhost:3001/events',
        { title: title.trim(), description: description.trim(), date },
        config
      );
      setEvents(prev => [res.data, ...prev]);
      setTitle(''); setDescription(''); setDate('');
      setShowForm(false);
      showToast('Événement créé avec succès !', 'success');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      await axios.post(`http://localhost:3001/registrations/${eventId}`, {}, config);
      setRegistrations(prev => [...prev, { event_id: eventId, status: 'inscrit' }]);
      showToast('Inscription confirmée !', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || "Erreur lors de l'inscription.", 'error');
    }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      await axios.delete(`http://localhost:3001/registrations/${eventId}`, config);
      setRegistrations(prev => prev.filter(r => r.event_id !== eventId));
      showToast('Désinscription effectuée.', 'success');
    } catch {
      showToast('Erreur lors de la désinscription.', 'error');
    }
  };

  const isRegistered = (eventId: number) =>
    registrations.some(r => r.event_id === eventId);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0)   return null;
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    return `Dans ${days} jours`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <span className={styles.navLogo}>⬡</span>
          <span className={styles.navBrand}>LinkShare</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.navUser}>
            <div className={styles.avatar}>
              {(localStorage.getItem('username') || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className={styles.avatarName}>
                {localStorage.getItem('username') || 'Utilisateur'}
              </div>
              <span className={`badge ${role === 'Admin' ? 'badge-yellow' : 'badge-blue'}`}>
                {role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Déconnexion
          </button>
        </div>
      </nav>
      <main className={styles.main}>
        <div className="container">
          <div className={`${styles.pageHeader} fade-up`}>
            <div>
              <h1>Événements</h1>
              <p className={styles.pageCount}>
                {events.length} événement{events.length !== 1 ? 's' : ''} disponible{events.length !== 1 ? 's' : ''}
              </p>
            </div>
            {role === 'Admin' && (
              <button className="btn btn-primary" onClick={() => setShowForm(f => !f)}>
                {showForm ? '✕ Annuler' : '+ Nouvel événement'}
              </button>
            )}
          </div>
          {showForm && role === 'Admin' && (
            <div className={`${styles.formCard} fade-up`}>
              <h3 style={{ marginBottom: 20 }}>Créer un événement</h3>
              <form onSubmit={handleCreate}>
                {formError && (
                  <div className={`${styles.formError} fade-in`}>⚠ {formError}</div>
                )}
                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label>Titre</label>
                    <input className="input" placeholder="Collecte alimentaire"
                      value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Date</label>
                    <input className="input" type="date"
                      value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label>Description</label>
                  <textarea className="input" placeholder="Décrivez l'événement…"
                    value={description} onChange={e => setDescription(e.target.value)}
                    rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost"
                    onClick={() => { setShowForm(false); setFormError(''); }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting && <span className="spinner" />}
                    {submitting ? 'Création…' : "Créer l'événement"}
                  </button>
                </div>
              </form>
            </div>
          )}
          {loading ? (
            <div className={styles.loadingState}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Chargement…</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>Aucun événement</h3>
              <p>Les événements créés apparaîtront ici.</p>
            </div>
          ) : (
            <div className={`${styles.grid} stagger`}>
              {events.map(ev => {
                const registered = isRegistered(ev.id);
                const countdown  = daysUntil(ev.date);
                const isPast     = new Date(ev.date) < new Date();

                return (
                  <div
                    key={ev.id}
                    className={[
                      'card',
                      'fade-up',
                      styles.eventCard,
                      registered ? styles.eventCardRegistered : '',
                      isPast     ? styles.eventCardPast       : '',
                    ].join(' ')}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>📅</span>
                      <div className={styles.cardBadges}>
                        {isPast ? (
                          <span className="badge badge-red">Terminé</span>
                        ) : countdown ? (
                          <span className="badge badge-green">{countdown}</span>
                        ) : null}
                        {registered && <span className="badge badge-blue">Inscrit ✓</span>}
                      </div>
                    </div>

                    <h3 className={styles.cardTitle}>{ev.title}</h3>
                    <p className={styles.cardDesc}>{ev.description}</p>

                    <div className={styles.cardFooter}>
                      <span className={styles.dateChip}>📆 {formatDate(ev.date)}</span>

                      {role === 'Bénévole' && !isPast && (
                        registered ? (
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleUnregister(ev.id)}>
                            Se désinscrire
                          </button>
                        ) : (
                          <button className="btn btn-success btn-sm"
                            onClick={() => handleRegister(ev.id)}>
                            S'inscrire
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}
        </div>
      )}
    </div>
  );
}
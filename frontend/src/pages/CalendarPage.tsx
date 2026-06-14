import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import styles from './CalendarPage.module.css';

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

interface Toast { message: string; type: 'success' | 'error'; }

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export default function CalendarPage() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents]             = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState<Toast | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        axios.get<Event[]>('http://localhost:3001/events', config),
        axios.get<Registration[]>('http://localhost:3001/registrations/mine', config),
      ]);
      setEvents(evRes.data);
      setRegistrations(regRes.data);
    } catch { showToast('Impossible de charger les données.', 'error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth     = new Date(year, month + 1, 0).getDate();

  let startDow = firstDayOfMonth.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const eventsThisMonth = events.filter(ev => {
    const d = new Date(ev.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const eventsOnDay = (day: number) =>
    eventsThisMonth.filter(ev => new Date(ev.date).getDate() === day);

  const isRegistered = (id: number) => registrations.some(r => r.event_id === id);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const handleRegister = async (eventId: number) => {
    try {
      await axios.post(`http://localhost:3001/registrations/${eventId}`, {}, config);
      setRegistrations(prev => [...prev, { event_id: eventId, status: 'inscrit' }]);
      showToast('Inscription confirmée !', 'success');
    } catch (err: any) { showToast(err.response?.data?.error || "Erreur lors de l'inscription.", 'error'); }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      await axios.delete(`http://localhost:3001/registrations/${eventId}`, config);
      setRegistrations(prev => prev.filter(r => r.event_id !== eventId));
      showToast('Désinscription effectuée.', 'success');
    } catch { showToast('Erreur lors de la désinscription.', 'error'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events
    .filter(ev => new Date(ev.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <span className={styles.navLogo}>⬡</span>
          <span className={styles.navBrand}>LinkShare</span>
        </div>
        <div className={styles.navRight}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>Événements</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/catalog')}>📦 Matériel</button>
          <div className={styles.navUser}>
            <div className={styles.avatar}>{(localStorage.getItem('username') || 'U')[0].toUpperCase()}</div>
            <div>
              <div className={styles.avatarName}>{localStorage.getItem('username') || 'Utilisateur'}</div>
              <span className={`badge ${role === 'Admin' ? 'badge-yellow' : 'badge-blue'}`}>{role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">Déconnexion</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.wrapper}>
          <div className={styles.calendarSection}>
            <div className={styles.calHeader}>
              <div className={styles.calNav}>
                <button className={styles.navBtn} onClick={prevMonth}>‹</button>
                <h2 className={styles.calTitle}>{MONTHS[month]} {year}</h2>
                <button className={styles.navBtn} onClick={nextMonth}>›</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={goToday}>Aujourd'hui</button>
            </div>

            <div className={styles.legend}>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotFuture}`}/>À venir</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotRegistered}`}/>Inscrit</span>
              <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotPast}`}/>Passé</span>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
              </div>
            ) : (
              <div className={styles.grid}>
                {DAYS.map(d => (
                  <div key={d} className={styles.dayHeader}>{d}</div>
                ))}

                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className={styles.cellEmpty} />;
                  const dayEvents = eventsOnDay(day);
                  const past      = isPast(day);
                  const today_    = isToday(day);
                  return (
                    <div key={day}
                      className={[
                        styles.cell,
                        past    ? styles.cellPast  : '',
                        today_  ? styles.cellToday : '',
                      ].join(' ')}>
                      <span className={styles.dayNum}>{day}</span>
                      <div className={styles.eventDots}>
                        {dayEvents.map(ev => (
                          <button
                            key={ev.id}
                            className={[
                              styles.eventPill,
                              isRegistered(ev.id) ? styles.pillRegistered : past ? styles.pillPast : styles.pillFuture,
                            ].join(' ')}
                            onClick={() => setSelectedEvent(ev)}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Prochains événements</h3>
            {upcoming.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>Aucun événement à venir.</p>
            ) : (
              <div className={styles.upcomingList}>
                {upcoming.map(ev => (
                  <button key={ev.id} className={styles.upcomingItem} onClick={() => setSelectedEvent(ev)}>
                    <div className={styles.upcomingDate}>
                      <span className={styles.upcomingDay}>{new Date(ev.date).getDate()}</span>
                      <span className={styles.upcomingMonth}>{MONTHS[new Date(ev.date).getMonth()].slice(0,3)}</span>
                    </div>
                    <div className={styles.upcomingInfo}>
                      <span className={styles.upcomingTitle}>{ev.title}</span>
                      {isRegistered(ev.id) && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Inscrit</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                {isRegistered(selectedEvent.id)
                  ? <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>Inscrit ✓</span>
                  : isPast(new Date(selectedEvent.date).getDate()) && new Date(selectedEvent.date).getMonth() === month && new Date(selectedEvent.date).getFullYear() === year
                    ? <span className="badge badge-red" style={{ marginBottom: 8, display: 'inline-block' }}>Terminé</span>
                    : <span className="badge badge-green" style={{ marginBottom: 8, display: 'inline-block' }}>À venir</span>
                }
                <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
                <p className={styles.modalDate}>📆 {formatDate(selectedEvent.date)}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>{selectedEvent.description}</p>
            </div>
            {!isPast(new Date(selectedEvent.date).getDate()) || !(new Date(selectedEvent.date).getMonth() === month && new Date(selectedEvent.date).getFullYear() === year) ? (
              <div className={styles.modalFooter}>
                {isRegistered(selectedEvent.id) ? (
                  <button className="btn btn-danger"
                    onClick={() => { handleUnregister(selectedEvent.id); setSelectedEvent(null); }}>
                    Se désinscrire
                  </button>
                ) : (
                  <button className="btn btn-primary"
                    onClick={() => { handleRegister(selectedEvent.id); }}>
                    S'inscrire à cet événement
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}
        </div>
      )}
    </div>
  );
}
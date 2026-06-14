import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ConfirmModal from '../components/ConfirmModal';
import { exportEvents } from '../utils/exportExcel';
import styles from './Events.module.css';

interface Event { id: number; title: string; description: string; date: string; }
interface Registration { event_id: number; status: string; }
interface MaterialReservation {
  id: number; material_nom: string; quantite: number;
  username: string; date_debut: string; date_fin: string; statut: string;
}
interface EventDetail { event: Event; participants: number; materials: MaterialReservation[]; }
interface Toast { message: string; type: 'success' | 'error'; }
interface Confirm { title: string; message: string; onConfirm: () => void; }

export default function Events() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const askConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirm({ title, message, onConfirm });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get<Event[]>('http://localhost:3001/events', config);
      setEvents(res.data);
    } catch { showToast('Impossible de charger les événements.', 'error'); }
    finally { setLoading(false); }
  }, [token]);

  const fetchRegistrations = useCallback(async () => {
    if (role !== 'Bénévole') return;
    try {
      const res = await axios.get<Registration[]>('http://localhost:3001/registrations/mine', config);
      setRegistrations(res.data);
    } catch {}
  }, [token, role]);

  useEffect(() => { fetchEvents(); fetchRegistrations(); }, [fetchEvents, fetchRegistrations]);

  const openEventModal = async (ev: Event) => {
    setSelectedEvent(ev); setEventDetail(null); setLoadingDetail(true);
    try {
      const [matsRes, regsRes] = await Promise.all([
        axios.get<MaterialReservation[]>(`http://localhost:3001/material-reservations/event/${ev.id}`, config),
        axios.get<Registration[]>(`http://localhost:3001/registrations/event/${ev.id}`, config).catch(() => ({ data: [] as Registration[] })),
      ]);
      setEventDetail({ event: ev, participants: (regsRes as any).data.length, materials: matsRes.data });
    } catch { setEventDetail({ event: ev, participants: 0, materials: [] }); }
    finally { setLoadingDetail(false); }
  };

  const closeModal = () => { setSelectedEvent(null); setEventDetail(null); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!title.trim() || !description.trim() || !date) { setFormError('Tous les champs sont requis.'); return; }
    setSubmitting(true);
    try {
      const res = await axios.post<Event>('http://localhost:3001/events',
        { title: title.trim(), description: description.trim(), date }, config);
      setEvents(prev => [res.data, ...prev]);
      setTitle(''); setDescription(''); setDate(''); setShowForm(false);
      showToast('Événement créé !', 'success');
    } catch (err: any) { setFormError(err.response?.data?.error || 'Erreur lors de la création.'); }
    finally { setSubmitting(false); }
  };

  const handleRegister = async (eventId: number) => {
    try {
      await axios.post(`http://localhost:3001/registrations/${eventId}`, {}, config);
      setRegistrations(prev => [...prev, { event_id: eventId, status: 'inscrit' }]);
      if (eventDetail && selectedEvent?.id === eventId)
        setEventDetail(prev => prev ? { ...prev, participants: prev.participants + 1 } : prev);
      showToast('Inscription confirmée !', 'success');
    } catch (err: any) { showToast(err.response?.data?.error || "Erreur lors de l'inscription.", 'error'); }
  };

  const handleUnregister = (eventId: number) => askConfirm(
    'Se désinscrire',
    'Êtes-vous sûr de vouloir vous désinscrire de cet événement ?',
    async () => {
      setConfirm(null);
      try {
        await axios.delete(`http://localhost:3001/registrations/${eventId}`, config);
        setRegistrations(prev => prev.filter(r => r.event_id !== eventId));
        if (eventDetail && selectedEvent?.id === eventId)
          setEventDetail(prev => prev ? { ...prev, participants: Math.max(0, prev.participants - 1) } : prev);
        showToast('Désinscription effectuée.', 'success');
      } catch { showToast('Erreur lors de la désinscription.', 'error'); }
    }
  );

  const isRegistered = (eventId: number) => registrations.some(r => r.event_id === eventId);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const getEventStatus = (d: string) => {
    const ev = new Date(d); const td = new Date();
    ev.setHours(0,0,0,0); td.setHours(0,0,0,0);
    const diff = Math.round((ev.getTime() - td.getTime()) / 86400000);
    if (diff < 0)  return { label: 'Terminé',       color: 'badge-red',    isPast: true };
    if (diff === 0) return { label: "Aujourd'hui",   color: 'badge-yellow', isPast: false };
    if (diff === 1) return { label: 'Demain',        color: 'badge-green',  isPast: false };
    return { label: `Dans ${diff} jours`, color: 'badge-green', isPast: false };
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/catalog')}>📦 Matériel</button>
      {role === 'Bénévole' && (
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>📅 Calendrier</button>
      )}
    </>
  );
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <span className={styles.navLogo}>⬡</span>
          <span className={styles.navBrand}>LinkShare</span>
        </div>
        <div className={styles.navRight}>
          {navLinks}
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
        <div className="container">
          <div className={`${styles.pageHeader} fade-up`}>
            <div>
              <h1>Événements</h1>
              <p className={styles.pageCount}>{events.length} événement{events.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportEvents(events)}
                title="Exporter en Excel" disabled={events.length === 0}>
                ⬇ Excel
              </button>
              {role === 'Admin' && (
                <button className="btn btn-primary" onClick={() => setShowForm(f => !f)}>
                  {showForm ? '✕ Annuler' : '+ Nouvel événement'}
                </button>
              )}
            </div>
          </div>
          {showForm && role === 'Admin' && (
            <div className={`${styles.formCard} fade-up`}>
              <h3 style={{ marginBottom: 20 }}>Créer un événement</h3>
              <form onSubmit={handleCreate}>
                {formError && <div className={`${styles.formError} fade-in`}>⚠ {formError}</div>}
                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label>Titre</label>
                    <input className="input" placeholder="Collecte alimentaire" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Date</label>
                    <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label>Description</label>
                  <textarea className="input" placeholder="Décrivez l'événement…" value={description}
                    onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                </div>
                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError(''); }}>Annuler</button>
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
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
              <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Chargement…</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3>Aucun événement</h3><p>Les événements créés apparaîtront ici.</p>
            </div>
          ) : (
            <div className={`${styles.grid} stagger`}>
              {events.map(ev => {
                const status = getEventStatus(ev.date);
                const registered = isRegistered(ev.id);
                return (
                  <div key={ev.id}
                    className={['card','fade-up',styles.eventCard,registered?styles.eventCardRegistered:'',status.isPast?styles.eventCardPast:''].join(' ')}
                    onClick={() => openEventModal(ev)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && openEventModal(ev)}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>📅</span>
                      <div className={styles.cardBadges}>
                        <span className={`badge ${status.color}`}>{status.label}</span>
                        {registered && <span className="badge badge-blue">Inscrit ✓</span>}
                      </div>
                    </div>
                    <h3 className={styles.cardTitle}>{ev.title}</h3>
                    <p className={styles.cardDesc}>{ev.description}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.dateChip}>📆 {formatDate(ev.date)}</span>
                      <span className={styles.clickHint}>Voir le détail →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ flex: 1 }}>
                <div className={styles.modalBadges}>
                  {(() => { const s = getEventStatus(selectedEvent.date); return <span className={`badge ${s.color}`}>{s.label}</span>; })()}
                  {isRegistered(selectedEvent.id) && <span className="badge badge-blue">Inscrit ✓</span>}
                </div>
                <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
                <p className={styles.modalDate}>📆 {formatDate(selectedEvent.date)}</p>
              </div>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>{selectedEvent.description}</p>
              <div className="divider" />
              {loadingDetail ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}>
                  <span className="spinner" style={{ width:24, height:24, borderTopColor:'var(--primary)' }} />
                </div>
              ) : eventDetail ? (
                <>
                  <div className={styles.modalStats}>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{eventDetail.participants}</span>
                      <span className={styles.statLabel}>Participant{eventDetail.participants !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statValue}>{eventDetail.materials.length}</span>
                      <span className={styles.statLabel}>Article{eventDetail.materials.length !== 1 ? 's' : ''} réservé{eventDetail.materials.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className={styles.modalSection}>
                    <h4 className={styles.modalSectionTitle}>📦 Matériel réservé</h4>
                    {eventDetail.materials.length === 0 ? (
                      <p style={{ color:'var(--text-3)', fontSize:'0.88rem', fontStyle:'italic' }}>Aucun matériel réservé pour l'instant.</p>
                    ) : (
                      <div className={styles.materialTable}>
                        {eventDetail.materials.map(m => (
                          <div key={m.id} className={styles.materialRow}>
                            <div className={styles.materialRowLeft}>
                              <span className={styles.materialRowName}>{m.material_nom}</span>
                              <span style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>
                                par {m.username} · {m.date_debut === m.date_fin ? m.date_debut : `${m.date_debut} → ${m.date_fin}`}
                              </span>
                            </div>
                            <span className="badge badge-blue">× {m.quantite}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.reserveMaterialBtn}>
                      <button className="btn btn-primary btn-sm" onClick={() => { closeModal(); navigate('/catalog'); }}>
                        📦 Réserver du matériel pour cet événement
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            {role === 'Bénévole' && !getEventStatus(selectedEvent.date).isPast && (
              <div className={styles.modalFooter}>
                {isRegistered(selectedEvent.id) ? (
                  <button className="btn btn-danger" onClick={() => handleUnregister(selectedEvent.id)}>Se désinscrire</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => handleRegister(selectedEvent.id)}>S'inscrire à cet événement</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</div>}
    </div>
  );
}
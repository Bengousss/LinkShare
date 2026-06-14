import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ConfirmModal from '../components/ConfirmModal';
import { exportMaterials } from '../utils/exportExcel';
import styles from './Catalog.module.css';

interface Material {
  id: number;
  nom: string;
  description: string;
  quantite_totale: number;
  quantite_disponible: number;
  quantite_reservee: number;
  etat: string;
}
interface Event { id: number; title: string; date: string; }
interface MyReservation {
  id: number; material_nom: string; quantite: number;
  date_debut: string; date_fin: string; statut: string; event_title?: string;
}
interface Toast { message: string; type: 'success' | 'error'; }
interface Confirm { title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'primary'; }
type Tab = 'catalogue' | 'mes-reservations';

export default function Catalog() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('catalogue');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [myReservations, setMyReservations] = useState<MyReservation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRes, setLoadingRes] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [reservingMaterial, setReservingMaterial] = useState<Material | null>(null);
  const [resQuantite, setResQuantite] = useState(1);
  const [resDateDebut, setResDateDebut] = useState('');
  const [resDateFin, setResDateFin] = useState('');
  const [resEventId, setResEventId] = useState('');
  const [resError, setResError] = useState('');
  const [resSubmitting, setResSubmitting] = useState(false);

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [adminNom, setAdminNom] = useState('');
  const [adminDesc, setAdminDesc] = useState('');
  const [adminQte, setAdminQte] = useState(1);
  const [adminEtat, setAdminEtat] = useState('disponible');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const askConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'primary' = 'danger') =>
    setConfirm({ title, message, onConfirm, variant });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Material[]>('http://localhost:3001/materials', config);
      setMaterials(res.data);
    } catch { showToast('Impossible de charger le catalogue.', 'error'); }
    finally { setLoading(false); }
  }, [token]);

  const fetchMyReservations = useCallback(async () => {
    setLoadingRes(true);
    try {
      const res = await axios.get<MyReservation[]>('http://localhost:3001/material-reservations/mine', config);
      setMyReservations(res.data);
    } catch { showToast('Impossible de charger vos réservations.', 'error'); }
    finally { setLoadingRes(false); }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get<Event[]>('http://localhost:3001/events', config);
      setEvents(res.data);
    } catch {}
  }, [token]);

  useEffect(() => { fetchMaterials(); fetchEvents(); }, [fetchMaterials, fetchEvents]);
  useEffect(() => { if (tab === 'mes-reservations') fetchMyReservations(); }, [tab, fetchMyReservations]);

  const openReserveForm = (m: Material) => {
    setReservingMaterial(m); setResQuantite(1);
    setResDateDebut(''); setResDateFin(''); setResEventId(''); setResError('');
    setShowAdminForm(false);
  };
  const closeReserveForm = () => setReservingMaterial(null);

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResError('');
    const hasDebut = resDateDebut.trim() !== '';
    const hasFin   = resDateFin.trim()   !== '';

    if (!hasDebut && !hasFin)  { setResError('Veuillez renseigner les dates de début et de fin.'); return; }
    if (!hasDebut && hasFin)  { setResError('Veuillez renseigner aussi la date de début.'); return; }
    if (hasDebut && !hasFin)  { setResError('Veuillez renseigner aussi la date de fin.'); return; }
    if (new Date(resDateFin) <= new Date(resDateDebut)) {
      setResError('La date de fin doit être strictement après la date de début.'); return;
    }
    const today = new Date().toISOString().split('T')[0];
    setResSubmitting(true);
    try {
      await axios.post('http://localhost:3001/material-reservations', {
        material_id: reservingMaterial!.id, quantite: resQuantite,
        date_debut: resDateDebut || today, date_fin: resDateFin || today,
        event_id: resEventId || undefined,
      }, config);
      showToast('Réservation confirmée !', 'success');
      closeReserveForm(); fetchMaterials();
    } catch (err: any) {
      setResError(err.response?.data?.error || 'Erreur lors de la réservation.');
    } finally { setResSubmitting(false); }
  };

  const handleCancelReservation = (id: number) => askConfirm(
    'Annuler la réservation',
    'Êtes-vous sûr de vouloir annuler cette réservation ? Le stock sera libéré.',
    async () => {
      setConfirm(null);
      try {
        await axios.delete(`http://localhost:3001/material-reservations/${id}`, config);
        showToast('Réservation annulée.', 'success');
        fetchMyReservations(); fetchMaterials();
      } catch { showToast("Impossible d'annuler.", 'error'); }
    }
  );

  const openAdminCreate = () => {
    setEditingMaterial(null); setAdminNom(''); setAdminDesc(''); setAdminQte(1); setAdminEtat('disponible');
    setAdminError(''); setShowAdminForm(true); setReservingMaterial(null);
  };
  const openAdminEdit = (m: Material) => {
    setEditingMaterial(m); setAdminNom(m.nom); setAdminDesc(m.description);
    setAdminQte(m.quantite_totale); setAdminEtat(m.etat);
    setAdminError(''); setShowAdminForm(true); setReservingMaterial(null);
  };
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setAdminError('');
    if (!adminNom.trim() || adminQte < 1) { setAdminError('Nom et quantité (≥ 1) requis.'); return; }
    setAdminSubmitting(true);
    try {
      const body = { nom: adminNom.trim(), description: adminDesc.trim(), quantite_totale: adminQte, etat: adminEtat };
      if (editingMaterial) {
        await axios.put(`http://localhost:3001/materials/${editingMaterial.id}`, body, config);
        showToast('Matériel modifié.', 'success');
      } else {
        await axios.post('http://localhost:3001/materials', body, config);
        showToast('Matériel ajouté !', 'success');
      }
      setShowAdminForm(false); fetchMaterials();
    } catch (err: any) { setAdminError(err.response?.data?.error || 'Erreur.'); }
    finally { setAdminSubmitting(false); }
  };
  const handleDelete = (id: number, nom: string) => askConfirm(
    'Supprimer le matériel',
    `Supprimer "${nom}" du catalogue ? Cette action est irréversible.`,
    async () => {
      setConfirm(null);
      try {
        await axios.delete(`http://localhost:3001/materials/${id}`, config);
        showToast('Matériel supprimé.', 'success'); fetchMaterials();
      } catch { showToast('Erreur lors de la suppression.', 'error'); }
    }
  );

  const getStockInfo = (m: Material) => {
    if (m.etat === 'hors service')   return { pct: 100, color: 'var(--text-3)',  label: 'Hors service',    dispo: 0 };
    if (m.etat === 'en maintenance') return { pct: 100, color: 'var(--warning)', label: 'En maintenance', dispo: 0 };
    const dispo = Math.max(0, m.quantite_disponible ?? 0);
    const pct   = m.quantite_totale > 0 ? (dispo / m.quantite_totale) * 100 : 0;
    const color = pct === 0 ? 'var(--danger)' : pct < 30 ? 'var(--warning)' : 'var(--success)';
    return { pct, color, label: `${dispo} / ${m.quantite_totale}`, dispo };
  };
  const canReserve   = (m: Material) => m.etat === 'disponible' && Math.max(0, m.quantite_disponible ?? 0) > 0;
  const etatBadge    = (e: string) => e === 'hors service' ? 'badge-red' : e === 'en maintenance' ? 'badge-yellow' : 'badge-green';
  const statutBadge  = (s: string) => s === 'confirmée' ? 'badge-green' : s === 'annulée' ? 'badge-red' : 'badge-yellow';
  const activeResCount = myReservations.filter(r => r.statut !== 'annulée').length;
  const handleLogout = () => { logout(); navigate('/login'); };

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
              <h1>Matériel</h1>
              <p className={styles.pageCount}>{materials.length} article{materials.length !== 1 ? 's' : ''} au catalogue</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportMaterials(materials)}
                title="Exporter en Excel" disabled={materials.length === 0}>
                ⬇ Excel
              </button>
              {role === 'Admin' && tab === 'catalogue' && (
                <button className="btn btn-primary" onClick={openAdminCreate}>+ Ajouter un article</button>
              )}
            </div>
          </div>

          <div className={`${styles.tabs} fade-up`}>
            <button className={`${styles.tab} ${tab === 'catalogue' ? styles.tabActive : ''}`} onClick={() => setTab('catalogue')}>
              📦 Catalogue
            </button>
            {role !== 'Admin' && (
              <button className={`${styles.tab} ${tab === 'mes-reservations' ? styles.tabActive : ''}`} onClick={() => setTab('mes-reservations')}>
                🗓 Mes réservations
                {activeResCount > 0 && <span className={styles.tabBadge}>{activeResCount}</span>}
              </button>
            )}
          </div>

          {tab === 'catalogue' && (
            <>
              {reservingMaterial && (
                <div className={`${styles.formCard} fade-up`}>
                  <div className={styles.formCardHeader}>
                    <h3>Réserver — {reservingMaterial.nom}</h3>
                    <button className={styles.closeBtn} onClick={closeReserveForm}>✕</button>
                  </div>
                  <p className={styles.formHint}>
                    Stock disponible : <strong>{Math.max(0, reservingMaterial.quantite_disponible ?? 0)}</strong> / {reservingMaterial.quantite_totale}.
                    Les dates sont optionnelles pour une réservation immédiate.
                  </p>
                  <form onSubmit={handleReservation}>
                    {resError && <div className={styles.formError}>⚠ {resError}</div>}
                    <div className={styles.formGrid}>
                      <div className="input-group">
                        <label>Quantité</label>
                        <input className="input" type="number" min={1}
                          max={Math.max(1, reservingMaterial.quantite_disponible ?? 1)}
                          value={resQuantite} onChange={e => setResQuantite(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="input-group">
                        <label>Associer à un événement (optionnel)</label>
                        <select className="input" value={resEventId} onChange={e => setResEventId(e.target.value)}>
                          <option value="">— Aucun événement —</option>
                          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Date de début (optionnel)</label>
                        <input className="input" type="date" value={resDateDebut} onChange={e => setResDateDebut(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Date de fin (optionnel)</label>
                        <input className="input" type="date" value={resDateFin} onChange={e => setResDateFin(e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" className="btn btn-ghost" onClick={closeReserveForm}>Annuler</button>
                      <button type="submit" className="btn btn-primary" disabled={resSubmitting}>
                        {resSubmitting && <span className="spinner" />}
                        {resSubmitting ? 'Réservation…' : 'Confirmer la réservation'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showAdminForm && role === 'Admin' && (
                <div className={`${styles.formCard} fade-up`}>
                  <div className={styles.formCardHeader}>
                    <h3>{editingMaterial ? 'Modifier' : 'Ajouter'} un article</h3>
                    <button className={styles.closeBtn} onClick={() => setShowAdminForm(false)}>✕</button>
                  </div>
                  <form onSubmit={handleAdminSubmit}>
                    {adminError && <div className={styles.formError}>⚠ {adminError}</div>}
                    <div className={styles.formGrid}>
                      <div className="input-group">
                        <label>Nom</label>
                        <input className="input" placeholder="Tables pliantes" value={adminNom} onChange={e => setAdminNom(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Quantité totale</label>
                        <input className="input" type="number" min={1} value={adminQte} onChange={e => setAdminQte(parseInt(e.target.value) || 1)} />
                      </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                      <label>Description</label>
                      <textarea className="input" rows={2} placeholder="Description…" value={adminDesc}
                        onChange={e => setAdminDesc(e.target.value)} style={{ resize: 'vertical' }} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 20 }}>
                      <label>État</label>
                      <select className="input" value={adminEtat} onChange={e => setAdminEtat(e.target.value)}>
                        <option value="disponible">Disponible</option>
                        <option value="en maintenance">En maintenance</option>
                        <option value="hors service">Hors service</option>
                      </select>
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" className="btn btn-ghost" onClick={() => setShowAdminForm(false)}>Annuler</button>
                      <button type="submit" className="btn btn-primary" disabled={adminSubmitting}>
                        {adminSubmitting && <span className="spinner" />}
                        {adminSubmitting ? 'Enregistrement…' : editingMaterial ? 'Modifier' : 'Ajouter'}
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
              ) : materials.length === 0 ? (
                <div className="empty-state"><h3>Catalogue vide</h3><p>Aucun matériel enregistré.</p></div>
              ) : (
                <div className={`${styles.grid} stagger`}>
                  {materials.map(m => {
                    const stock = getStockInfo(m);
                    const reservable = canReserve(m);
                    const isReserving = reservingMaterial?.id === m.id;
                    return (
                      <div key={m.id} className={`card fade-up ${styles.materialCard} ${isReserving ? styles.materialCardActive : ''}`}>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardIcon}>📦</span>
                          <span className={`badge ${etatBadge(m.etat)}`}>{m.etat}</span>
                        </div>
                        <h3 className={styles.cardTitle}>{m.nom}</h3>
                        <p className={styles.cardDesc}>{m.description || 'Aucune description.'}</p>
                        <div className={styles.stockBar}>
                          <div className={styles.stockLabel}>
                            <span>Disponibilité</span>
                            <span style={{ color: stock.color, fontWeight: 600 }}>{stock.label}</span>
                          </div>
                          <div className={styles.stockTrack}>
                            <div className={styles.stockFill} style={{ width: `${stock.pct}%`, background: stock.color }} />
                          </div>
                        </div>
                        <div className={styles.cardFooter}>
                          {role === 'Admin' ? (
                            <div className={styles.adminActions}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openAdminEdit(m)}>✏ Modifier</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.nom)}>🗑</button>
                            </div>
                          ) : reservable ? (
                            <button className={`btn btn-sm ${isReserving ? 'btn-ghost' : 'btn-success'}`}
                              onClick={() => isReserving ? closeReserveForm() : openReserveForm(m)}>
                              {isReserving ? '✕ Annuler' : '+ Réserver'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                              {m.etat === 'hors service' ? 'Hors service' : m.etat === 'en maintenance' ? 'En maintenance' : 'Stock épuisé'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'mes-reservations' && role !== 'Admin' && (
            <div className="fade-up">
              {loadingRes ? (
                <div className={styles.loadingState}>
                  <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
                  <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Chargement…</p>
                </div>
              ) : myReservations.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </svg>
                  <h3>Aucune réservation</h3>
                  <p>Vous n'avez pas encore réservé de matériel.</p>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('catalogue')}>Voir le catalogue</button>
                </div>
              ) : (
                <div className={styles.reservationList}>
                  {myReservations.map(r => (
                    <div key={r.id} className={`card ${styles.reservationCard}`}>
                      <div className={styles.reservationHeader}>
                        <div>
                          <h3 className={styles.reservationTitle}>📦 {r.material_nom}</h3>
                          {r.event_title && <p style={{ fontSize: '0.82rem', color: 'var(--primary)', marginTop: 2 }}>📅 {r.event_title}</p>}
                        </div>
                        <span className={`badge ${statutBadge(r.statut)}`}>{r.statut}</span>
                      </div>
                      <div className={styles.reservationMeta}>
                        <span>Quantité : <strong>{r.quantite}</strong></span>
                        <span>{r.date_debut === r.date_fin ? `Le ${r.date_debut}` : `Du ${r.date_debut} au ${r.date_fin}`}</span>
                      </div>
                      {r.statut !== 'annulée' && (
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelReservation(r.id)}>Annuler</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {confirm && (
        <ConfirmModal title={confirm.title} message={confirm.message}
          variant={confirm.variant} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✓ ' : '⚠ '}{toast.message}</div>
      )}
    </div>
  );
}
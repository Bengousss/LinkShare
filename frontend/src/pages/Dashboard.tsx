import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './Dashboard.module.css';

interface Event    { id: number; title: string; date: string; description: string; }
interface Material { id: number; nom: string; quantite_totale: number; quantite_disponible: number; etat: string; }
interface MyRegistration { event_id: number; status: string; }
interface MyReservation  { id: number; material_nom: string; quantite: number; date_debut: string; date_fin: string; statut: string; event_title?: string; }
interface AllReservation { id: number; material_nom: string; quantite: number; username: string; statut: string; }

const COLORS = ['#4f8ef7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

const monthLabel = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

const groupByMonth = (items: { date: string }[]) => {
  const map: Record<string, number> = {};
  items.forEach(i => {
    const k = monthLabel(i.date);
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).map(([mois, count]) => ({ mois, count }));
};

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={styles.kpiCard}>
      <span className={styles.kpiValue} style={{ color: color || 'var(--primary)' }}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </div>
  );
}

function Nav({ role, onLogout }: { role: string | null; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <span className={styles.navLogo}>⬡</span>
        <span className={styles.navBrand}>LinkShare</span>
      </div>
      <div className={styles.navRight}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>Événements</button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/catalog')}>📦 Matériel</button>
        {role === 'Bénévole' && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>📅 Calendrier</button>
        )}
        <div className={styles.navUser}>
          <div className={styles.avatar}>{(localStorage.getItem('username') || 'U')[0].toUpperCase()}</div>
          <div>
            <div className={styles.avatarName}>{localStorage.getItem('username') || 'Utilisateur'}</div>
            <span className={`badge ${role === 'Admin' ? 'badge-yellow' : 'badge-blue'}`}>{role}</span>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-ghost btn-sm">Déconnexion</button>
      </div>
    </nav>
  );
}

function DashboardBenevole({ token }: { token: string }) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const navigate = useNavigate();

  const [events, setEvents]        = useState<Event[]>([]);
  const [myRegs, setMyRegs]        = useState<MyRegistration[]>([]);
  const [myRes, setMyRes]          = useState<MyReservation[]>([]);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get<Event[]>('http://localhost:3001/events', config),
      axios.get<MyRegistration[]>('http://localhost:3001/registrations/mine', config),
      axios.get<MyReservation[]>('http://localhost:3001/material-reservations/mine', config),
    ]).then(([ev, regs, res]) => {
      setEvents(ev.data);
      setMyRegs(regs.data);
      setMyRes(res.data);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className={styles.loadingState}>
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
      <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Chargement…</p>
    </div>
  );

  const registeredIds = new Set(myRegs.map(r => r.event_id));
  const myEvents      = events.filter(e => registeredIds.has(e.id));
  const now           = new Date(); now.setHours(0,0,0,0);
  const pastEvents    = myEvents.filter(e => new Date(e.date) < now);
  const futureEvents  = myEvents.filter(e => new Date(e.date) >= now);
  const activeRes     = myRes.filter(r => r.statut !== 'annulée');

  const eventsByMonth = groupByMonth(myEvents.map(e => ({ date: e.date })));

  const matCount: Record<string, number> = {};
  activeRes.forEach(r => { matCount[r.material_nom] = (matCount[r.material_nom] || 0) + r.quantite; });
  const matData = Object.entries(matCount).map(([nom, qte]) => ({ nom, qte })).sort((a,b) => b.qte - a.qte).slice(0,5);

  return (
    <div className={styles.content}>
      <div className="fade-up">
        <h1 style={{ marginBottom: 4 }}>Bonjour, {localStorage.getItem('username')} 👋</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>Voici un résumé de votre activité sur LinkShare.</p>
      </div>

      <div className={`${styles.kpiGrid} fade-up`}>
        <KpiCard label="Événements rejoints"   value={myEvents.length}   color="var(--primary)" />
        <KpiCard label="Événements à venir"    value={futureEvents.length} color="var(--success)" />
        <KpiCard label="Événements passés"     value={pastEvents.length}  color="var(--text-2)" />
        <KpiCard label="Réservations actives"  value={activeRes.length}   color="var(--warning)" />
      </div>

      <div className={styles.chartsRow}>
        <div className={`card ${styles.chartCard} fade-up`}>
          <h3 className={styles.chartTitle}>Mes événements par mois</h3>
          {eventsByMonth.length === 0 ? (
            <div className={styles.emptyChart}>
              <p>Pas encore d'événements rejoints.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/events')}>
                Rejoindre un événement
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventsByMonth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="mois" tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)' }} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                <Bar dataKey="count" name="Événements" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`card ${styles.chartCard} fade-up`}>
          <h3 className={styles.chartTitle}>Matériel réservé (top 5)</h3>
          {matData.length === 0 ? (
            <div className={styles.emptyChart}>
              <p>Aucune réservation de matériel.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/catalog')}>
                Voir le catalogue
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={matData} dataKey="qte" nameKey="nom" cx="50%" cy="50%" outerRadius={80}>
                  {matData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {futureEvents.length > 0 && (
        <div className={`card fade-up`} style={{ marginTop: 24 }}>
          <h3 className={styles.chartTitle}>Mes prochains événements</h3>
          <div className={styles.eventList}>
            {futureEvents.slice(0, 5).map(ev => (
              <div key={ev.id} className={styles.eventRow}>
                <div>
                  <span className={styles.eventRowTitle}>{ev.title}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginLeft: 10 }}>{new Date(ev.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <span className="badge badge-green">À venir</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRes.length > 0 && (
        <div className={`card fade-up`} style={{ marginTop: 24 }}>
          <h3 className={styles.chartTitle}>Mes réservations de matériel</h3>
          <div className={styles.eventList}>
            {activeRes.slice(0, 5).map(r => (
              <div key={r.id} className={styles.eventRow}>
                <div>
                  <span className={styles.eventRowTitle}>📦 {r.material_nom}</span>
                  {r.event_title && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginLeft: 8 }}>— {r.event_title}</span>}
                </div>
                <span className="badge badge-blue">× {r.quantite}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardAdmin({ token }: { token: string }) {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const navigate = useNavigate();

  const [events,    setEvents]    = useState<Event[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allRes,    setAllRes]    = useState<AllReservation[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get<Event[]>('http://localhost:3001/events', config),
      axios.get<Material[]>('http://localhost:3001/materials', config),
      axios.get<AllReservation[]>('http://localhost:3001/material-reservations', config),
      axios.get<any[]>('http://localhost:3001/auth/users', config).catch(() => ({ data: [] })),
    ]).then(([ev, mat, res, users]) => {
      setEvents(ev.data);
      setMaterials(mat.data);
      setAllRes(res.data);
      setUserCount((users as any).data.length);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className={styles.loadingState}>
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
      <p style={{ marginTop: 16, color: 'var(--text-2)' }}>Chargement…</p>
    </div>
  );

  const now         = new Date(); now.setHours(0,0,0,0);
  const futureEvs   = events.filter(e => new Date(e.date) >= now);
  const pastEvs     = events.filter(e => new Date(e.date) < now);
  const activeRes   = allRes.filter(r => r.statut !== 'annulée');
  const stockOk     = materials.filter(m => m.etat === 'disponible').length;
  const stockIssue  = materials.filter(m => m.etat !== 'disponible').length;

  const eventsByMonth = groupByMonth(events.map(e => ({ date: e.date })));

  const matCount: Record<string, number> = {};
  activeRes.forEach(r => { matCount[r.material_nom] = (matCount[r.material_nom] || 0) + r.quantite; });
  const topMat = Object.entries(matCount).map(([nom, qte]) => ({ nom, qte })).sort((a,b) => b.qte - a.qte).slice(0,6);

  const recentRes = [...allRes].reverse().slice(0, 5);

  return (
    <div className={styles.content}>
      <div className="fade-up">
        <h1 style={{ marginBottom: 4 }}>Vue d'ensemble</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>Tableau de bord administrateur LinkShare.</p>
      </div>

      <div className={`${styles.kpiGrid} fade-up`}>
        <KpiCard label="Utilisateurs"        value={userCount}          color="var(--primary)" />
        <KpiCard label="Événements total"    value={events.length}      color="var(--success)" sub={`${futureEvs.length} à venir · ${pastEvs.length} passés`} />
        <KpiCard label="Articles au stock"   value={materials.length}   color="var(--warning)" sub={`${stockOk} disponibles · ${stockIssue} indisponibles`} />
        <KpiCard label="Réservations actives" value={activeRes.length}  color="var(--danger)" />
      </div>

      <div className={styles.chartsRow}>
        <div className={`card ${styles.chartCard} fade-up`}>
          <h3 className={styles.chartTitle}>Événements par mois</h3>
          {eventsByMonth.length === 0 ? (
            <div className={styles.emptyChart}><p>Aucun événement créé.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventsByMonth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="mois" tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)' }} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                <Bar dataKey="count" name="Événements" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`card ${styles.chartCard} fade-up`}>
          <h3 className={styles.chartTitle}>Top matériel réservé</h3>
          {topMat.length === 0 ? (
            <div className={styles.emptyChart}><p>Aucune réservation enregistrée.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMat} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-2)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nom" tick={{ fill: 'var(--text-2)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)' }} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                <Bar dataKey="qte" name="Qté réservée" radius={[0,4,4,0]}>
                  {topMat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={`card fade-up`} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className={styles.chartTitle} style={{ marginBottom: 0 }}>État du stock</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/catalog')}>Gérer →</button>
        </div>
        <div className={styles.stockGrid}>
          {materials.slice(0, 6).map(m => {
            const dispo = Math.max(0, m.quantite_disponible ?? 0);
            const pct   = m.quantite_totale > 0 ? (dispo / m.quantite_totale) * 100 : 0;
            const color = m.etat !== 'disponible' ? 'var(--text-3)' : pct === 0 ? 'var(--danger)' : pct < 30 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={m.id} className={styles.stockItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.nom}</span>
                  <span style={{ fontSize: '0.78rem', color }}>{m.etat !== 'disponible' ? m.etat : `${dispo}/${m.quantite_totale}`}</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${m.etat !== 'disponible' ? 100 : pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {recentRes.length > 0 && (
        <div className={`card fade-up`} style={{ marginTop: 24 }}>
          <h3 className={styles.chartTitle}>Réservations récentes</h3>
          <div className={styles.eventList}>
            {recentRes.map(r => (
              <div key={r.id} className={styles.eventRow}>
                <div>
                  <span className={styles.eventRowTitle}>📦 {r.material_nom}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginLeft: 8 }}>par {r.username}</span>
                </div>
                <span className={`badge ${r.statut === 'confirmée' ? 'badge-green' : 'badge-red'}`}>{r.statut}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.layout}>
      <Nav role={role} onLogout={handleLogout} />
      <main className={styles.main}>
        <div className="container">
          {role === 'Admin'
            ? <DashboardAdmin  token={token!} />
            : <DashboardBenevole token={token!} />
          }
        </div>
      </main>
    </div>
  );
}
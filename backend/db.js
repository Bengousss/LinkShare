const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./linkshare.');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role     TEXT DEFAULT 'Bénévole'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      date        TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id  INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      status   TEXT DEFAULT 'inscrit',
      UNIQUE(user_id, event_id),
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nom              TEXT NOT NULL,
      description      TEXT,
      quantite_totale  INTEGER NOT NULL DEFAULT 1,
      etat             TEXT DEFAULT 'disponible'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS material_reservations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      user_id     INTEGER NOT NULL,
      event_id    INTEGER,
      quantite    INTEGER NOT NULL DEFAULT 1,
      date_debut  TEXT NOT NULL,
      date_fin    TEXT NOT NULL,
      statut      TEXT DEFAULT 'en attente',
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
      FOREIGN KEY (event_id)    REFERENCES events(id)    ON DELETE SET NULL
    )
  `);

  db.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
    if (err || row.count > 0) return;
    const adminPassword = bcrypt.hashSync('admin123', 8);
    db.run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      ['admin', adminPassword, 'Admin'],
      () => console.log('✓ Compte Admin créé → login: admin | password: admin123')
    );
  });

  db.get(`SELECT COUNT(*) as count FROM events`, [], (err, row) => {
    if (err || row.count > 0) return;
    const demoEvents = [
      { title: 'Collecte alimentaire',      description: 'Distribution de nourriture aux personnes dans le besoin. Manutention légère.',              date: '2026-06-15' },
      { title: 'Nettoyage du parc Blandan', description: 'Action citoyenne pour nettoyer le parc municipal. Gants et sacs fournis.',                  date: '2026-06-22' },
      { title: 'Atelier informatique seniors', description: "Initiation à l'informatique pour les seniors du quartier. Patience et pédagogie !",      date: '2026-07-05' },
      { title: 'Maraude centre-ville',      description: "Distribution de repas chauds et de kits d'hygiène aux personnes sans-abri.",               date: '2026-07-12' },
    ];
    demoEvents.forEach(ev => {
      db.run(
        `INSERT INTO events (title, description, date) VALUES (?, ?, ?)`,
        [ev.title, ev.description, ev.date]
      );
    });
    console.log('✓ Événements de démonstration chargés');
  });

  db.get(`SELECT COUNT(*) as count FROM materials`, [], (err, row) => {
    if (err || row.count > 0) return;
    const demoMaterials = [
      { nom: 'Tables pliantes',      description: 'Tables légères pour installation rapide sur le terrain.',  quantite_totale: 10, etat: 'disponible' },
      { nom: 'Chaises pliantes',     description: 'Chaises légères pour les participants et bénévoles.',       quantite_totale: 30, etat: 'disponible' },
      { nom: 'Gilets bénévoles',     description: 'Gilets orange haute-visibilité taille unique.',             quantite_totale: 20, etat: 'disponible' },
      { nom: 'Mégaphone',            description: 'Mégaphone 15W pour coordination sur le terrain.',          quantite_totale: 2,  etat: 'disponible' },
      { nom: 'Sono portable',        description: 'Enceinte Bluetooth rechargeable pour animations.',          quantite_totale: 3,  etat: 'disponible' },
      { nom: 'Kit premiers secours', description: 'Trousse complète conforme normes EN 13157.',               quantite_totale: 5,  etat: 'disponible' },
      { nom: 'Barrières Vauban',     description: 'Barrières de sécurité pour délimiter les zones.',          quantite_totale: 15, etat: 'disponible' },
      { nom: 'Tentes 3x3m',          description: 'Barnums faciles à monter, résistants à la pluie.',         quantite_totale: 4,  etat: 'disponible' },
    ];
    demoMaterials.forEach(m => {
      db.run(
        `INSERT INTO materials (nom, description, quantite_totale, etat) VALUES (?, ?, ?, ?)`,
        [m.nom, m.description, m.quantite_totale, m.etat]
      );
    });
    console.log('✓ Matériel de démonstration chargé');
  });

});

module.exports = db;
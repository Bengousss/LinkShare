const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcryptjs');

const db = new sqlite3.Database(':memory:');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT    UNIQUE NOT NULL,
      password TEXT    NOT NULL,
      role     TEXT    DEFAULT 'Bénévole'
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

  const adminPassword = bcrypt.hashSync('admin123', 8);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['admin', adminPassword, 'Admin'],
    (err) => {
      if (!err) console.log('✓ Compte Admin prêt → login: admin | password: admin123');
    }
  );

  const demoEvents = [
    {
      title:       'Collecte alimentaire',
      description: 'Distribution de nourriture aux personnes dans le besoin. Manutention légère.',
      date:        '2026-06-15',
    },
    {
      title:       'Nettoyage du parc Blandan',
      description: 'Action citoyenne pour nettoyer le parc municipal. Gants et sacs fournis.',
      date:        '2026-06-22',
    },
    {
      title:       'Atelier informatique seniors',
      description: 'Initiation à l\'informatique pour les seniors du quartier. Patience et pédagogie !',
      date:        '2026-07-05',
    },
    {
      title:       'Maraude centre-ville',
      description: 'Distribution de repas chauds et de kits d\'hygiène aux personnes sans-abri.',
      date:        '2026-07-12',
    },
  ];

  demoEvents.forEach((ev) => {
    db.run(
      `INSERT INTO events (title, description, date) VALUES (?, ?, ?)`,
      [ev.title, ev.description, ev.date]
    );
  });

  console.log('✓ Événements de démonstration chargés');
});

module.exports = db;
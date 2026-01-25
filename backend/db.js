const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(':memory:');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'Bénévole'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      date TEXT
    )
  `);

  const adminUsername = 'admin';
  const adminPassword = bcrypt.hashSync('admin123', 8);

  db.run(
    `INSERT OR IGNORE INTO users (username, password, role)
     VALUES (?, ?, ?)`,
    [adminUsername, adminPassword, 'Admin'],
    (err) => {
      if (err) {
        console.error('Erreur création admin:', err.message);
      } else {
        console.log('Compte Admin prêt → login: admin | password: admin123');
      }
    }
  );
  const demoEvents = [
    {
      title: 'Collecte alimentaire',
      description: 'Distribution de nourriture aux personnes dans le besoin',
      date: '2026-02-10',
    },
    {
      title: 'Nettoyage du parc',
      description: 'Action citoyenne pour nettoyer le parc municipal',
      date: '2026-02-15',
    },
    {
      title: 'Atelier informatique',
      description: 'Initiation à l’informatique pour seniors',
      date: '2026-02-20',
    },
  ];

  demoEvents.forEach((event) => {
    db.run(
      `INSERT INTO events (title, description, date)
       VALUES (?, ?, ?)`,
      [event.title, event.description, event.date]
    );
  });

  console.log('Événements de démonstration chargés');
});

module.exports = db;

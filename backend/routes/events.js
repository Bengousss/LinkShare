const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('./auth');

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, date } = req.body;
  db.run(`INSERT INTO events(title, description, date) VALUES(?, ?, ?)`, [title, description, date], function(err) {
    if (err) return res.status(400).json({ error: 'Erreur' });
    res.json({ id: this.lastID, title, description, date });
  });
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, date } = req.body;
  db.run(`UPDATE events SET title=?, description=?, date=? WHERE id=?`, [title, description, date, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: 'Erreur' });
    res.json({ success: true });
  });
});

router.get('/', authMiddleware, (req, res) => {
  db.all(`SELECT * FROM events`, [], (err, rows) => {
    if (err) return res.status(400).json({ error: 'Erreur' });
    res.json(rows);
  });
});

module.exports = router;

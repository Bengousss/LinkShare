const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authMiddleware } = require('./auth');

router.post('/:eventId', authMiddleware, (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId  = req.user.id;

  db.get(`SELECT * FROM events WHERE id = ?`, [eventId], (err, event) => {
    if (err || !event) return res.status(404).json({ error: 'Événement introuvable' });

    db.run(
      `INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'inscrit')`,
      [userId, eventId],
      function (err) {
        if (err) return res.status(400).json({ error: 'Vous êtes déjà inscrit à cet événement' });
        res.status(201).json({
          id:       this.lastID,
          event_id: eventId,
          user_id:  userId,
          status:   'inscrit',
        });
      }
    );
  });
});

router.delete('/:eventId', authMiddleware, (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId  = req.user.id;

  db.run(
    `DELETE FROM registrations WHERE user_id = ? AND event_id = ?`,
    [userId, eventId],
    function (err) {
      if (err)              return res.status(500).json({ error: 'Erreur serveur' });
      if (this.changes === 0) return res.status(404).json({ error: 'Inscription non trouvée' });
      res.json({ success: true });
    }
  );
});

router.get('/mine', authMiddleware, (req, res) => {
  db.all(
    `SELECT r.id, r.event_id, r.status, e.title, e.date
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ?
     ORDER BY e.date ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(rows);
    }
  );
});

router.get('/event/:eventId', authMiddleware, (req, res) => {
  const eventId = parseInt(req.params.eventId);

  db.all(
    `SELECT r.id, r.status, u.id as user_id, u.username, u.role
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = ?
     ORDER BY u.username ASC`,
    [eventId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(rows);
    }
  );
});

module.exports = router;
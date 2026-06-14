const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('./auth');

router.post('/', authMiddleware, (req, res) => {
  const { material_id, event_id, quantite, date_debut, date_fin } = req.body;
  const user_id = req.user.id;

  if (!material_id || !quantite || !date_debut || !date_fin) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  if (quantite < 1) {
    return res.status(400).json({ error: 'La quantité doit être supérieure à 0' });
  }
  if (new Date(date_fin) <= new Date(date_debut)) {
    return res.status(400).json({ error: 'La date de fin doit être après la date de début' });
  }

  db.get(`SELECT * FROM materials WHERE id = ?`, [material_id], (err, material) => {
    if (err || !material) return res.status(404).json({ error: 'Matériel introuvable' });
    if (material.etat === 'hors service') {
      return res.status(400).json({ error: 'Ce matériel est hors service' });
    }

    db.get(
      `SELECT COALESCE(SUM(mr.quantite), 0) AS total_reserve
       FROM material_reservations mr
       WHERE mr.material_id = ?
         AND mr.statut != 'annulée'
         AND mr.date_debut < ?
         AND mr.date_fin   > ?`,
      [material_id, date_fin, date_debut],
      (err2, row) => {
        if (err2) return res.status(500).json({ error: 'Erreur serveur' });

        const disponible = material.quantite_totale - row.total_reserve;
        if (quantite > disponible) {
          return res.status(400).json({
            error: `Quantité insuffisante. Disponible sur cette période : ${disponible}`,
          });
        }

        db.run(
          `INSERT INTO material_reservations
             (material_id, user_id, event_id, quantite, date_debut, date_fin, statut)
           VALUES (?, ?, ?, ?, ?, ?, 'confirmée')`,
          [material_id, user_id, event_id || null, quantite, date_debut, date_fin],
          function (err3) {
            if (err3) return res.status(500).json({ error: 'Erreur lors de la réservation' });
            res.status(201).json({
              id: this.lastID,
              material_id,
              user_id,
              event_id: event_id || null,
              quantite,
              date_debut,
              date_fin,
              statut: 'confirmée',
            });
          }
        );
      }
    );
  });
});

router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    `SELECT mr.*, m.nom AS material_nom, u.username, e.title AS event_title
     FROM material_reservations mr
     JOIN materials m ON m.id = mr.material_id
     JOIN users    u ON u.id  = mr.user_id
     LEFT JOIN events e ON e.id = mr.event_id
     ORDER BY mr.date_debut ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(rows);
    }
  );
});

router.get('/mine', authMiddleware, (req, res) => {
  db.all(
    `SELECT mr.*, m.nom AS material_nom, e.title AS event_title
     FROM material_reservations mr
     JOIN materials m ON m.id = mr.material_id
     LEFT JOIN events e ON e.id = mr.event_id
     WHERE mr.user_id = ?
     ORDER BY mr.date_debut ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(rows);
    }
  );
});

router.get('/event/:eventId', authMiddleware, (req, res) => {
  db.all(
    `SELECT mr.*, m.nom AS material_nom, u.username
     FROM material_reservations mr
     JOIN materials m ON m.id = mr.material_id
     JOIN users    u ON u.id  = mr.user_id
     WHERE mr.event_id = ? AND mr.statut != 'annulée'
     ORDER BY m.nom ASC`,
    [req.params.eventId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      res.json(rows);
    }
  );
});

router.delete('/:id', authMiddleware, (req, res) => {
  const condition =
    req.user.role === 'Admin'
      ? `id = ?`
      : `id = ? AND user_id = ${req.user.id}`;

  db.run(
    `UPDATE material_reservations SET statut = 'annulée' WHERE ${condition}`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      if (this.changes === 0)
        return res.status(404).json({ error: 'Réservation introuvable ou non autorisée' });
      res.json({ success: true });
    }
  );
});

module.exports = router;
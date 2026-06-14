const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('./auth');

router.get('/', authMiddleware, (req, res) => {

  db.all(
    `SELECT
       m.*,
       COALESCE(SUM(CASE WHEN mr.statut = 'confirmée' THEN mr.quantite ELSE 0 END), 0) AS quantite_reservee,
       m.quantite_totale - COALESCE(SUM(CASE WHEN mr.statut = 'confirmée' THEN mr.quantite ELSE 0 END), 0) AS quantite_disponible
     FROM materials m
     LEFT JOIN material_reservations mr ON mr.material_id = m.id
     GROUP BY m.id
     ORDER BY m.nom ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erreur serveur' });
      const safe = rows.map(r => ({
        ...r,
        quantite_reservee:   Math.max(0, r.quantite_reservee),
        quantite_disponible: Math.max(0, r.quantite_disponible),
      }));
      res.json(safe);
    }
  );
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM materials WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (!row) return res.status(404).json({ error: 'Matériel introuvable' });
    res.json(row);
  });
});

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { nom, description, quantite_totale, etat } = req.body;
  if (!nom || !quantite_totale) return res.status(400).json({ error: 'Nom et quantité sont requis' });
  if (quantite_totale < 1)      return res.status(400).json({ error: 'La quantité doit être ≥ 1' });

  db.run(
    `INSERT INTO materials (nom, description, quantite_totale, etat) VALUES (?, ?, ?, ?)`,
    [nom.trim(), description?.trim() || '', quantite_totale, etat || 'disponible'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erreur lors de la création' });
      res.status(201).json({ id: this.lastID, nom, description, quantite_totale, etat: etat || 'disponible' });
    }
  );
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { nom, description, quantite_totale, etat } = req.body;
  if (!nom || !quantite_totale) return res.status(400).json({ error: 'Nom et quantité sont requis' });

  db.run(
    `UPDATE materials SET nom = ?, description = ?, quantite_totale = ?, etat = ? WHERE id = ?`,
    [nom.trim(), description?.trim() || '', quantite_totale, etat || 'disponible', req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erreur lors de la modification' });
      if (this.changes === 0) return res.status(404).json({ error: 'Matériel introuvable' });
      res.json({ success: true });
    }
  );
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.run(`DELETE FROM materials WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (this.changes === 0) return res.status(404).json({ error: 'Matériel introuvable' });
    res.json({ success: true });
  });
});

module.exports = router;
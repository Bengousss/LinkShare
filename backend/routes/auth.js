const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = 'secret123'; 

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin seulement' });
  next();
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 8);
  db.run(`INSERT INTO users(username, password) VALUES(?, ?)`, [username, hashed], function(err) {
    if (err) return res.status(400).json({ error: 'Utilisateur existe déjà' });
    res.json({ id: this.lastID, username, role: 'Bénévole' });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username=?`, [username], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET);
    res.json({ token, role: user.role });
  });
});

router.put('/role/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { role } = req.body;
  db.run(`UPDATE users SET role=? WHERE id=?`, [role, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: 'Erreur' });
    res.json({ success: true });
  });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'linkshare_dev_secret_change_in_prod';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)       return res.status(400).json({ error: 'Champs requis manquants' });
  if (username.length < 3)          return res.status(400).json({ error: 'Nom d\'utilisateur trop court (3 min)' });
  if (password.length < 6)          return res.status(400).json({ error: 'Mot de passe trop court (6 min)' });

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, 'Bénévole')`,
    [username, hashed],
    function (err) {
      if (err) return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
      res.status(201).json({ id: this.lastID, username, role: 'Bénévole' });
    }
  );
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis manquants' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET
    );
    res.json({ token, role: user.role, username: user.username });
  });
});

router.put('/role/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { role } = req.body;
  const allowedRoles = ['Admin', 'Bénévole', 'Coordinateur'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (this.changes === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ success: true, message: `Rôle mis à jour : ${role}` });
  });
});

router.get('/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, username, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  });
});

module.exports = router;
module.exports.authMiddleware  = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
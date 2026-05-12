# ⬡ LinkShare

> Plateforme de gestion de bénévoles et de matériel pour associations.

LinkShare est une application web full-stack conçue pour centraliser la coordination des associations : gestion des bénévoles, planification d'événements et suivi du matériel. Le projet est actuellement en phase de prototype actif.

---

## Sommaire

- [Contexte](#contexte)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Utilisation](#utilisation)
- [Limitations connues](#limitations-connues)
- [Évolutions prévues](#évolutions-prévues)
- [Licence](#licence)

---

## Contexte

LinkShare est une plateforme unique, moderne, accessible et intuitive, pensée pour des associations de toutes tailles.

---

## Fonctionnalités

### Disponibles (prototype actuel)

- **Authentification sécurisée** — inscription, connexion, déconnexion via JWT
- **Gestion des rôles** — Admin, Coordinateur, Bénévole avec permissions différenciées
- **Consultation des événements** — liste avec dates, descriptions et statuts
- **Création d'événements** — réservée aux Admins (titre, description, date)
- **Inscription à un événement** — les bénévoles peuvent s'inscrire et se désinscrire
- **Hashage des mots de passe** — bcrypt
- **Interface responsive** — thème sombre, design moderne

### Prévues (roadmap)

- [ ] Gestion du matériel (catalogue, réservation, suivi d'état)
- [ ] Système de notifications par e-mail (rappels pré-événement)
- [ ] Tableaux de bord et rapports d'activité
- [ ] Validation des inscriptions par un coordinateur
- [ ] Migration vers MySQL/PostgreSQL (base persistante)
- [ ] Déploiement en production (o2switch + PM2)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript, React Router, Axios |
| Styles | CSS Modules + variables CSS custom |
| Backend | Node.js + Express.js |
| Base de données | SQLite en mémoire (`sqlite3`) — prototype |
| Authentification | JWT (`jsonwebtoken`) + `bcryptjs` |
| Environnement | `.env` via `dotenv` |

---

## Architecture du projet

```
LinkShare/
├── backend/
│   ├── routes/
│   │   ├── auth.js            # Inscription, connexion, gestion des rôles
│   │   ├── events.js          # CRUD événements
│   │   └── registrations.js   # Inscription/désinscription des bénévoles
│   ├── db.js                  # Initialisation SQLite + seed de démonstration
│   ├── server.js              # Point d'entrée Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx + Login.module.css
│   │   │   ├── Register.tsx + Register.module.css
│   │   │   └── Events.tsx + Events.module.css
│   │   ├── App.tsx            # Routing + AuthContext
│   │   ├── App.css            # Composants CSS globaux
│   │   └── index.css          # Charte visuelle (variables, animations)
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prérequis

- [Node.js](https://nodejs.org/) **v18+**
- **npm v9+** (ou yarn / pnpm)
- [Git](https://git-scm.com/)

---

## Installation et lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/Bengousss/LinkShare.git
cd LinkShare
```

### 2. Lancer le backend

```bash
cd backend
npm install
node server.js
```

Le serveur démarre sur **http://localhost:3001**

Au démarrage, le backend initialise automatiquement :
- La base de données SQLite en mémoire
- Un compte Admin de démonstration
- 4 événements de démonstration

### 3. Lancer le frontend

Dans un **nouveau terminal** :

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## Comptes de démonstration

| Rôle | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Bénévole | *(créer via /register)* | *(au choix)* |

> ⚠️ Ces identifiants sont uniquement destinés au prototype. Ne pas utiliser en production.

---

## Utilisation

### Page `/login`
- Connexion avec le compte Admin ou un compte Bénévole créé
- Lien vers `/register` pour créer un nouveau compte

### Page `/register`
- Création d'un compte Bénévole
- Validation du mot de passe en temps réel (indicateur de force)

### Page `/events`
- **Admin** : consulter les événements existants + créer de nouveaux événements
- **Bénévole** : consulter les événements + s'inscrire / se désinscrire

---

## Limitations connues

- **Base de données non persistante** : SQLite en mémoire, toutes les données sont perdues au redémarrage du backend. Prévu : migration vers MySQL.
- **Pas de notifications** : le système d'e-mails automatiques n'est pas encore implémenté.
- **Gestion du matériel absente** du frontend (modèle de données prévu côté backend).
- **Pas de tests automatisés** pour le moment (Jest prévu).

---

## Évolutions prévues

Ce projet est en développement actif. Les prochaines étapes sont suivies via les [issues GitHub](https://github.com/Bengousss/LinkShare/issues).

---

## Licence

Projet réalisé dans un cadre éducatif — libre pour usage personnel et pédagogique.  
© 2025-2026 Benjamin VARENNE — ESTIAM

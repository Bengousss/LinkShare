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
- **Gestion des rôles** — Admin, Bénévole avec permissions différenciées
- **Consultation des événements** — liste avec dates, descriptions et statuts
- **Création, Suppression et Modification d'événements** — réservée aux Admins (titre, description, date)
- **Inscription à un événement** — les bénévoles peuvent s'inscrire et se désinscrire
- **Gestion du matériel** — les bénévoles peuvent réserver du matériel et (optionnel) l'associer à un évènement
- **Consulter ses réservation** — les bénévoles peuvent consulter leur réservation
- **Création, Suppression et Modification de matériel** — réservée aux Admins (titre, description, quanitité, état)
- **Dashboard** — les utilisateurs peuvent consulter des dashboard avec leur statistique personnalisé via une page dédiée
- **Consulter son Calendrier** — les utilisateurs peuvent consulter un calendrier avec les évnèments passés et futurs via une page dédiée
- **Export Excel** — les utilisateurs peuvent exporter un Excel des évènements et des stocks (avec leur informations respectives) via un bouton sur ces pages
- **Hashage des mots de passe** — bcrypt
- **Interface responsive** — thème sombre, design moderne

### Prévues (roadmap)

- [ ] Système de notifications par e-mail (rappels pré-événement)
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
│   │   ├── auth.js                  # Inscription, connexion, gestion des rôles
│   │   ├── events.js                # CRUD événements
│   │   ├── materials.js             # CRUD matériel
│   │   ├── materialReservations.js  # Gestion de la réservation de matériel
│   │   └── registrations.js         # Inscription/désinscription des bénévoles
│   ├── db.js                        # Initialisation SQLite + seed de démonstration
│   ├── server.js                    # Point d'entrée Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.tsx + ConfirmModal.module.css
│   │   ├── pages/
│   │   │   ├── Login.tsx + Login.module.css
│   │   │   ├── Register.tsx + Register.module.css
│   │   │   └── Events.tsx + Events.module.css
│   │   │   └── Dashboard.tsx + Dashboard.module.css
│   │   │   └── Catalog.tsx + Catalog.module.css
│   │   │   └── CalendarPage.tsx + CalendarPage.module.css
│   │   ├── utils/
│   │   │   └── ExportExcel.ts
│   │   ├── App.tsx            # Routing + AuthContext
│   │   ├── App.css            # Composants CSS globaux
│   │   └── index.css          # Charte visuelle (variables, animations)
│   │   └── main.tsx
│   └── package.json
│   └── tsconfig
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

### Page `/Catalog`
- **Admin** : consulter le matériel disponible + créer de nouveau matériel
- **Bénévole** : consulter le matériel + réserver / annuler sa réservation

### Page `/Dashboard`
- **Admin** : consulter les graphiques avec des statistiques générales
- **Bénévole** : consulter les graphiques avec des statistiques personnelles

### Page `/CalendarPage`
- **Admin** : consulter un calendrier avec les évènements passés et futurs
- **Bénévole** : consulter un calendrier avec les évènements passés et futurs

---

## Limitations connues

- **Pas de notifications** : le système d'e-mails automatiques n'est pas encore implémenté.
- **Pas de tests automatisés** pour le moment (Jest prévu).

---

## Évolutions prévues

Ce projet est en développement actif. Les prochaines étapes sont suivies via les [issues GitHub](https://github.com/Bengousss/LinkShare/issues).

---

## Licence

Projet réalisé dans un cadre éducatif — libre pour usage personnel et pédagogique.  

# LinkShare

LinkShare est, pour l'instant, un prototype d'application web permettant de gérer des événements.
L'objectif principal est de mettre au service des associations, une application web le permettant de gérer leur évènement, leur matériel et d'organiser les bénévoles.
Afin de garantir l'efficacité du temps offert par les bénévoles, notamment dans les missions courtes.
Les utilisateurs peuvent s'inscrire, se connecter, consulter les événements, et les administrateurs peuvent créer et gérer les événements.

## Architecture du projet 

LinkShare/  
├─ backend/  
├─ frontend/  
├─ .gitignore  
└─ README.md  


**Backend** : Express, SQLite en mémoire (prototype), bcrypt pour le hash des mots de passe, JWT pour l’authentification.  
**Frontend** : React + TypeScript, routes pour Login, Register, Events.  
Les événements sont pré-remplis pour avoir un rendu visuel immédiat.

## Prérequis

- Node.js v18+  
- npm v9+ (ou yarn / pnpm)  
- Git

## Installation et lancement

Dans le terminal :  
git clone https://github.com/Bengousss/LinkShare.git  
cd LinkShare  
cd backend  
npm install # Installe les dépendances  
node server.js # http://localhost:3001  

(Le backend crée automatiquement un compte Admin et des événements de démonstration : Username : admin | Password : admin123)

cd ../frontend  
npm install # Installe les dépendances  
npm run dev # Démarre l'application frontend  

## Utilisation

Arrivée sur /login :

- Possibilité de se connecter avec le compte Admin existant.
- Possibilité de cliquer sur “S’inscrire”, ce qui redirige vers /register pour créer un nouveau compte Bénévole (par défaut).

Accès à la page /events :

- Admin : peut créer et consulter les événements existants.
- Bénévole : peut uniquement consulter les événements.

Notes importantes :

- La base de données est actuellement en mémoire (SQLite). Les données sont donc perdues à chaque redémarrage du backend.
- Les mots de passe sont simplifiés pour le prototype → à ne pas utiliser en production.          

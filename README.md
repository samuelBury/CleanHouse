# CleanHouse - Application Mobile de Services de Nettoyage

Application mobile React Native développée avec Expo pour la réservation de services de nettoyage à domicile.

## Description

CleanHouse est une application mobile moderne permettant aux utilisateurs de réserver facilement des services de ménage et de repassage à domicile. L'application offre une interface intuitive avec un système de réservation complet incluant la sélection de services, la planification, et le paiement.

## Fonctionnalités

- **Trois types de services disponibles** :
  - Ménage 🏠
  - Repassage 👔
  - Ménage & Repassage ✨

- **Système de réservation complet** :
  - Saisie de l'adresse
  - Sélection de la date et de l'heure
  - Choix de la durée (1 à 8 heures)
  - Choix du moyen de paiement (Carte bancaire ou Espèce)
  - Confirmation animée de la réservation

- **Interface utilisateur moderne** :
  - Design épuré avec des visuels attrayants
  - Animations fluides (pulse et ping)
  - Navigation intuitive avec modals
  - Composants réutilisables

## Technologies utilisées

- **React Native** - Framework de développement mobile
- **Expo** - Plateforme de développement et de déploiement
- **TypeScript** - Typage statique pour JavaScript
- **React Native SVG** - Gestion des images SVG
- **React Native DateTimePicker** - Sélecteurs de date et heure natifs
- **React Native Safe Area Context** - Gestion des zones sûres

## Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn
- Expo CLI
- Expo Go (application mobile pour tester)

## Installation

1. Cloner le repository :
```bash
git clone https://github.com/samuelBury/CleanHouse.git
cd CleanHouse
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer l'application :
```bash
npx expo start
```

4. Scanner le QR code avec l'application Expo Go sur votre téléphone

## Structure du projet

```
CleanAppExpo/
├── components/
│   ├── BackgroundSVG.tsx      # Composant SVG de fond
│   ├── BookingModal.tsx       # Modal de réservation
│   ├── BookingSection.tsx     # Section des réservations
│   ├── BottomNav.tsx          # Navigation inférieure
│   ├── ConfirmationModal.tsx  # Modal de confirmation animée
│   ├── Header.tsx             # En-tête de l'application
│   ├── HeroCard.tsx           # Carte hero avec image
│   ├── PaymentModal.tsx       # Modal de sélection du paiement
│   └── ServicesSection.tsx    # Section des services disponibles
├── assets/
│   └── images/                # Images de l'application
├── App.tsx                    # Composant principal
├── package.json               # Dépendances du projet
└── README.md                  # Documentation
```

## Composants principaux

### App.tsx
Point d'entrée principal de l'application qui gère l'état global et orchestre les différents modals.

### ServicesSection
Affiche les trois services disponibles sous forme de cartes cliquables.

### BookingModal
Modal permettant de :
- Saisir l'adresse
- Sélectionner la date
- Choisir l'heure
- Définir la durée du service

### PaymentModal
Modal de sélection du moyen de paiement avec deux options :
- Carte bancaire
- Espèce

### ConfirmationModal
Modal de confirmation avec animations (pulse et ping) indiquant que la recherche d'un professionnel est en cours.

## Flux de réservation

1. L'utilisateur sélectionne un service (Ménage, Repassage, ou les deux)
2. Le modal de réservation s'ouvre avec le service pré-sélectionné
3. L'utilisateur remplit les informations (adresse, date, heure, durée)
4. Confirmation de la réservation ouvre le modal de paiement
5. Sélection du moyen de paiement
6. Confirmation finale avec animation de recherche de professionnel

## Personnalisation

Les couleurs principales peuvent être modifiées dans les styles de chaque composant :
- Couleur principale : `#5FB17C` (vert)
- Couleur secondaire : `#C5F2D8` (vert clair)
- Couleur accent : `#6B3520` (marron)

## Développement

Pour contribuer au projet :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT.

## Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

Développé avec Claude Code

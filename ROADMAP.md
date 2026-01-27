# CleanHouse - Roadmap

> Dernière mise à jour : 25 janvier 2025

---

## En cours

### Bug critique
- [ ] **Inscription iOS ne fonctionne pas** - Erreur réseau (status 0)
  - Build 10 en cours avec fix `NSAppTransportSecurity`
  - À tester dès que le build est disponible sur TestFlight

---

## À faire

### App Cliente (CleanHouse)
- [ ] Tester l'inscription après Build 10
- [ ] Tester la connexion (login)
- [ ] Tester le flux de réservation complet
- [ ] Tester les notifications push
- [ ] Tester le paiement Stripe

### App Pro (CleanHousePro)
- [ ] Vérifier le statut du build
- [ ] Tester l'inscription/connexion pro
- [ ] Tester la réception des missions
- [ ] Tester le suivi GPS en temps réel

### Admin Dashboard
- [ ] Vérifier le déploiement Vercel
- [ ] Tester la connexion admin
- [ ] Tester la gestion des utilisateurs
- [ ] Tester la gestion des missions
- [ ] Tester la LiveMap

### Backend (Railway)
- [ ] Vérifier les logs d'erreur
- [ ] Tester l'envoi d'emails (vérification compte)
- [ ] Configurer un domaine personnalisé (optionnel)

### Déploiement Production
- [ ] Soumettre CleanHouse à l'App Store
- [ ] Soumettre CleanHousePro à l'App Store
- [ ] Configurer Stripe en mode production
- [ ] Configurer les emails en production

---

## Terminé

- [x] Configuration EAS Build
- [x] Configuration EAS Update (OTA)
- [x] Déploiement backend sur Railway
- [x] Déploiement admin dashboard sur Vercel
- [x] Configuration TestFlight
- [x] Ajout des privacy descriptions iOS
- [x] Configuration CI/CD GitHub Actions
- [x] Désactivation New Architecture (fix tentative)
- [x] Ajout NSAppTransportSecurity (Build 10)

---

## Architecture

```
📱 App Store / TestFlight
├── CleanHouse (clients)
└── CleanHousePro (pros)

☁️ Railway (~5€/mois)
└── API Node.js + PostgreSQL

🖥️ Vercel (gratuit)
└── Admin Dashboard

📦 Expo (EAS)
└── Build & OTA Updates
```

---

## Notes

- **Build actuel** : 1.0.0 (10) en cours
- **Problème principal** : Les requêtes réseau sont bloquées sur iOS (XMLHttpRequest status 0)
- **Hypothèse** : App Transport Security bloque les requêtes HTTPS depuis l'app

---

## Historique des mises à jour

| Date | Changement |
|------|------------|
| 25/01/2025 | Création du document |
| 25/01/2025 | Ajout fix NSAppTransportSecurity (Build 10) |

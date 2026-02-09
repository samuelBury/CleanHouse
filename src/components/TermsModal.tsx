import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Colors} from '../config/theme';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'terms' | 'privacy' | 'legal';

const TERMS_CONTENT = `Dernière mise à jour : Janvier 2025

1. ACCEPTATION DES CONDITIONS

En utilisant l'application CleanHome, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.

2. DESCRIPTION DU SERVICE

CleanHome est une plateforme de mise en relation entre des particuliers et des professionnels du ménage et du repassage à domicile. Nous facilitons la réservation de prestations de nettoyage.

3. INSCRIPTION ET COMPTE

- Vous devez avoir au moins 18 ans pour créer un compte
- Les informations fournies doivent être exactes et à jour
- Vous êtes responsable de la confidentialité de vos identifiants
- Un seul compte par personne est autorisé

4. RÉSERVATIONS

- Les réservations sont confirmées après validation du paiement
- L'annulation gratuite est possible jusqu'à 24h avant la prestation
- En cas d'annulation tardive, des frais peuvent s'appliquer
- CleanHome se réserve le droit d'annuler une réservation en cas de force majeure

5. PAIEMENTS

- Les paiements sont sécurisés via Stripe
- Les prix affichés incluent toutes les taxes
- Le paiement est débité à la confirmation de la réservation
- Les remboursements sont traités sous 5-10 jours ouvrés

6. RESPONSABILITÉS

- CleanHome agit en tant qu'intermédiaire
- Les prestataires sont des professionnels indépendants
- CleanHome n'est pas responsable des dommages causés pendant la prestation
- Une assurance responsabilité civile couvre les prestataires

7. COMPORTEMENT

Vous vous engagez à :
- Respecter les prestataires
- Fournir un accès sécurisé à votre domicile
- Signaler tout problème dans les 24h
- Ne pas utiliser le service à des fins illégales

8. PROPRIÉTÉ INTELLECTUELLE

L'application, son design et son contenu sont la propriété de CleanHome. Toute reproduction est interdite sans autorisation.

9. MODIFICATIONS

CleanHome peut modifier ces conditions à tout moment. Les utilisateurs seront informés des changements significatifs.

10. CONTACT

Pour toute question : legal@cleanhome.fr`;

const PRIVACY_CONTENT = `Dernière mise à jour : Janvier 2025

1. COLLECTE DES DONNÉES

Nous collectons les données suivantes :
- Informations d'identification (nom, email, téléphone)
- Adresses de prestation
- Historique des réservations
- Données de paiement (via Stripe)
- Données de géolocalisation (avec votre consentement)

2. UTILISATION DES DONNÉES

Vos données sont utilisées pour :
- Gérer votre compte et vos réservations
- Traiter les paiements
- Vous envoyer des notifications importantes
- Améliorer nos services
- Assurer la sécurité de la plateforme

3. PARTAGE DES DONNÉES

Nous partageons vos données avec :
- Les prestataires (nom, adresse de prestation)
- Stripe (traitement des paiements)
- Nos sous-traitants techniques (hébergement, emails)

Nous ne vendons jamais vos données personnelles.

4. CONSERVATION

- Données de compte : durée de l'inscription + 3 ans
- Données de facturation : 10 ans (obligation légale)
- Logs de connexion : 1 an

5. VOS DROITS (RGPD)

Vous avez le droit de :
- Accéder à vos données
- Rectifier vos informations
- Supprimer votre compte
- Exporter vos données
- Retirer votre consentement

Pour exercer ces droits : privacy@cleanhome.fr

6. COOKIES

L'application utilise des cookies techniques nécessaires au fonctionnement. Aucun cookie publicitaire n'est utilisé.

7. SÉCURITÉ

Nous mettons en œuvre des mesures de sécurité :
- Chiffrement des données (SSL/TLS)
- Stockage sécurisé des mots de passe
- Accès restreint aux données personnelles

8. TRANSFERTS INTERNATIONAUX

Vos données sont hébergées en Union Européenne. Aucun transfert hors UE n'est effectué.

9. CONTACT DPO

Délégué à la Protection des Données
Email : dpo@cleanhome.fr
Adresse : 123 Avenue des Champs-Élysées, 75008 Paris`;

const LEGAL_CONTENT = `MENTIONS LÉGALES

1. ÉDITEUR DE L'APPLICATION

CleanHome SAS
Capital social : 10 000 €
RCS Paris B 123 456 789
Siège social : 123 Avenue des Champs-Élysées, 75008 Paris
Téléphone : 01 23 45 67 89
Email : contact@cleanhome.fr

Directeur de la publication : Jean Martin

2. HÉBERGEMENT

Amazon Web Services (AWS)
38 Avenue John F. Kennedy
L-1855 Luxembourg

3. PROPRIÉTÉ INTELLECTUELLE

L'ensemble du contenu de l'application CleanHome (textes, images, logos, icônes, sons, logiciels, etc.) est la propriété exclusive de CleanHome SAS ou de ses partenaires.

Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite.

4. CRÉDITS

Design : CleanHome Design Team
Développement : CleanHome Tech Team
Icônes : System Emoji

5. ASSURANCE

CleanHome SAS est assuré auprès de :
AXA France
Contrat n° RC-2024-XXXXX
Garantie Responsabilité Civile Professionnelle

6. MÉDIATION

En cas de litige, vous pouvez recourir gratuitement au service de médiation :
Médiateur de la consommation
www.mediateur-consommation.fr

7. DROIT APPLICABLE

Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.`;

export default function TermsModal({
  visible,
  onClose,
}: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const handleClose = () => {
    setActiveTab('terms');
    onClose();
  };

  const tabs: {key: TabType; label: string}[] = [
    {key: 'terms', label: 'CGU'},
    {key: 'privacy', label: 'Confidentialité'},
    {key: 'legal', label: 'Mentions légales'},
  ];

  const getContent = () => {
    switch (activeTab) {
      case 'terms':
        return TERMS_CONTENT;
      case 'privacy':
        return PRIVACY_CONTENT;
      case 'legal':
        return LEGAL_CONTENT;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'terms':
        return "Conditions Générales d'Utilisation";
      case 'privacy':
        return 'Politique de Confidentialité';
      case 'legal':
        return 'Mentions Légales';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.container}>
          <LinearGradient colors={Colors.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.header}>
            <Text style={styles.headerTitle}>Documents légaux</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.tabActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.contentTitle}>{getTitle()}</Text>
            <Text style={styles.contentText}>{getContent()}</Text>
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
    backgroundColor: Colors.background.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
  },
});

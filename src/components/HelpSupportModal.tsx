import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors, Spacing, BorderRadius, Typography} from '../config/theme';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'Comment réserver un service de ménage ?',
    answer: 'Depuis l\'écran d\'accueil, sélectionnez le type de service souhaité (ménage, repassage ou les deux), choisissez la durée, la date et l\'heure, puis confirmez votre réservation.',
  },
  {
    question: 'Comment annuler une réservation ?',
    answer: 'Vous pouvez annuler une réservation depuis l\'écran Historique en sélectionnant la réservation concernée. L\'annulation est gratuite jusqu\'à 24h avant le rendez-vous.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre système de paiement sécurisé Stripe.',
  },
  {
    question: 'Comment modifier mon adresse ?',
    answer: 'Rendez-vous dans Profil > Lieux enregistrés pour ajouter, modifier ou supprimer vos adresses.',
  },
  {
    question: 'Que faire si je ne suis pas satisfait du service ?',
    answer: 'Contactez notre support dans les 24h suivant la prestation. Nous examinerons votre demande et vous proposerons une solution adaptée.',
  },
];

export default function HelpSupportModal({
  visible,
  onClose,
}: HelpSupportModalProps) {
  const [currentView, setCurrentView] = useState<'menu' | 'faq' | 'contact'>('menu');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    setCurrentView('menu');
    setExpandedFAQ(null);
    setContactSubject('');
    setContactMessage('');
    onClose();
  };

  const handleBack = () => {
    setCurrentView('menu');
    setExpandedFAQ(null);
  };

  const handleCall = () => {
    Linking.openURL('tel:+33123456789');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@cleanhome.fr?subject=Demande de support');
  };

  const handleSendMessage = async () => {
    if (!contactSubject.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un sujet');
      return;
    }
    if (!contactMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre message');
      return;
    }

    setSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);

    Alert.alert(
      'Message envoyé',
      'Notre équipe vous répondra dans les plus brefs délais.',
      [{text: 'OK', onPress: handleClose}]
    );
  };

  const renderMenu = () => (
    <>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentView('faq')}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <FontAwesome5 name="question-circle" size={20} color={Colors.primary} solid />
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>Questions fréquentes</Text>
            <Text style={styles.menuItemSubtitle}>
              Trouvez rapidement des réponses
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color={Colors.text.tertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentView('contact')}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <FontAwesome5 name="envelope" size={20} color={Colors.primary} solid />
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>Nous contacter</Text>
            <Text style={styles.menuItemSubtitle}>
              Envoyez-nous un message
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color={Colors.text.tertiary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleCall}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <FontAwesome5 name="phone-alt" size={20} color={Colors.primary} solid />
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>Appeler le support</Text>
            <Text style={styles.menuItemSubtitle}>
              Lun-Ven, 9h-18h
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color={Colors.text.tertiary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleEmail}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <FontAwesome5 name="at" size={20} color={Colors.primary} solid />
          </View>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemTitle}>Email</Text>
            <Text style={styles.menuItemSubtitle}>
              support@cleanhome.fr
            </Text>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color={Colors.text.tertiary} />
      </TouchableOpacity>
    </>
  );

  const renderFAQ = () => (
    <View style={styles.faqContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <FontAwesome5 name="arrow-left" size={14} color={Colors.primary} style={styles.backIcon} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Questions fréquentes</Text>

      {FAQ_DATA.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.faqItem}
          onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
          activeOpacity={0.7}
        >
          <View style={styles.faqHeader}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <FontAwesome5
              name={expandedFAQ === index ? 'minus' : 'plus'}
              size={14}
              color={Colors.primary}
            />
          </View>
          {expandedFAQ === index && (
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContact = () => (
    <View style={styles.contactContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <FontAwesome5 name="arrow-left" size={14} color={Colors.primary} style={styles.backIcon} />
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Nous contacter</Text>
      <Text style={styles.contactDescription}>
        Décrivez votre problème et notre équipe vous répondra rapidement.
      </Text>

      <Text style={styles.inputLabel}>Sujet</Text>
      <TextInput
        style={styles.input}
        value={contactSubject}
        onChangeText={setContactSubject}
        placeholder="Ex: Problème de réservation"
        placeholderTextColor={Colors.text.tertiary}
      />

      <Text style={styles.inputLabel}>Message</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={contactMessage}
        onChangeText={setContactMessage}
        placeholder="Décrivez votre demande en détail..."
        placeholderTextColor={Colors.text.tertiary}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          (!contactSubject || !contactMessage) && styles.sendButtonDisabled,
        ]}
        onPress={handleSendMessage}
        disabled={sending || !contactSubject || !contactMessage}
      >
        {sending ? (
          <ActivityIndicator color={Colors.text.inverse} />
        ) : (
          <Text style={styles.sendButtonText}>Envoyer</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Aide et support</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <FontAwesome5 name="times" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentView === 'menu' && renderMenu()}
            {currentView === 'faq' && renderFAQ()}
            {currentView === 'contact' && renderContact()}
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  // Menu styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'Colors.primaryBackground',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 20,
  },
  // FAQ styles
  faqContainer: {
    paddingBottom: 20,
  },
  faqItem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  // Contact styles
  contactContainer: {
    paddingBottom: 20,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border.medium,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});

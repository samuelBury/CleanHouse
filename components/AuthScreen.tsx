import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';

const {width} = Dimensions.get('window');

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({onAuthSuccess}: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^(\+33|0)[1-9](\d{2}){4}$/;
    return re.test(phone.replace(/\s/g, ''));
  };

  const handleLogin = () => {
    const newErrors: {[key: string]: string} = {};

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Simuler une connexion réussie
      onAuthSuccess();
    }
  };

  const handleRegister = () => {
    const newErrors: {[key: string]: string} = {};

    if (!name) {
      newErrors.name = 'Nom requis';
    }

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!phone) {
      newErrors.phone = 'Téléphone requis';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Numéro invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Simuler une inscription réussie
      onAuthSuccess();
    }
  };

  const formatPhone = (text: string) => {
    // Formater le numéro de téléphone
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    return formatted;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#789C8D" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>✨</Text>
          </View>
          <Text style={styles.logoText}>CleanHome</Text>
        </View>
        <Text style={styles.headerTitle}>
          {isLogin ? 'Bon retour !' : 'Créer un compte'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isLogin
            ? 'Connectez-vous pour accéder à vos services'
            : 'Inscrivez-vous pour profiter de nos services'}
        </Text>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Toggle Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(true);
                setErrors({});
              }}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(false);
                setErrors({});
              }}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Field (Register only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="exemple@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Field (Register only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhone(text))}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
          )}

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          )}

          {/* Forgot Password (Login only) */}
          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={isLogin ? handleLogin : handleRegister}
          >
            <Text style={styles.submitButtonText}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}></Text>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Terms (Register only) */}
          {!isLogin && (
            <Text style={styles.termsText}>
              En vous inscrivant, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#789C8D',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoIconText: {
    fontSize: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#789C8D',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#789C8D',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#789C8D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#789C8D',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#999',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '700',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#789C8D',
    fontWeight: '500',
  },
});

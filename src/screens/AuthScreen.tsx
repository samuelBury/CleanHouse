// Écran d'authentification - Design CleanHome
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validators, validationMessages } from '../utils/validators';
import { formatters } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle, loginWithApple, isLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validators.isValidEmail(email)) {
      Alert.alert('Erreur', validationMessages.email.invalid);
      return;
    }

    const result = await login({ email, password });
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Échec de la connexion');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validators.isValidEmail(email)) {
      Alert.alert('Erreur', validationMessages.email.invalid);
      return;
    }

    if (!validators.isValidPassword(password)) {
      Alert.alert('Erreur', validationMessages.password.tooShort);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', validationMessages.password.mismatch);
      return;
    }

    const result = await register({ email, password, name, phone: phone.replace(/\s/g, '') });
    if (!result.success) {
      Alert.alert('Erreur', result.error || "Échec de l'inscription");
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Info', 'Google Sign-In sera implémenté prochainement');
  };

  const handleAppleLogin = async () => {
    Alert.alert('Info', 'Apple Sign-In sera implémenté prochainement');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ImageBackground
        source={require('../../assets/images/BackgroundAuth.jpeg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay sombre */}
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo et titre */}
            <View style={styles.headerSection}>
              <Text style={styles.logoIcon}>✨</Text>
              <Text style={styles.logoText}>CLEANHOME</Text>
              <Text style={styles.subtitle}>Services de ménage à Paris</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.formSection}>
              {/* Champs d'inscription uniquement */}
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom complet"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>📱</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Téléphone"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={phone}
                      onChangeText={(text) => setPhone(formatters.formatPhone(text))}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="exemple@email.com"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Mot de passe */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoComplete="off"
                  textContentType="oneTimeCode"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>

              {/* Confirmation mot de passe (inscription) */}
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>
              )}

              {/* Bouton principal */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={isLogin ? handleLogin : handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isLogin ? 'SE CONNECTER' : "S'INSCRIRE"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Mot de passe oublié */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Boutons sociaux */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButtonGoogle}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialIconGoogle}>G</Text>
                  <Text style={styles.socialTextGoogle}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButtonApple}
                  onPress={handleAppleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialIconApple}></Text>
                  <Text style={styles.socialTextApple}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Lien inscription/connexion */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.switchLink}>
                    {isLogin ? "S'inscrire" : 'Se connecter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 8,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  formSection: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  primaryButton: {
    backgroundColor: '#4cb04f',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4cb04f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButtonGoogle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    height: 50,
    gap: 8,
  },
  socialIconGoogle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  socialTextGoogle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  socialButtonApple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  socialIconApple: {
    fontSize: 22,
    color: '#fff',
  },
  socialTextApple: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  switchText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  switchLink: {
    color: '#4cb04f',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;

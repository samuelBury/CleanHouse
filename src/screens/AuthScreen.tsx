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
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { validators, validationMessages } from '../utils/validators';
import { formatters } from '../utils/formatters';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

// Version pour debug - incrémenter à chaque build
const APP_BUILD_VERSION = 'B25-FINAL';

const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle, loginWithApple, isLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    if (loginLoading) return;

    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!validators.isValidEmail(email)) {
      Alert.alert('Erreur', validationMessages.email.invalid);
      return;
    }

    setLoginLoading(true);
    setTestResult('Connexion...');

    try {
      const API_URL = 'https://cleanhouse-production.up.railway.app/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoginLoading(false);

      if (response.ok && data.data) {
        // Succès - stocker les tokens via le context
        const { user, accessToken, refreshToken } = data.data;
        const result = await login({ email, password });
        if (result.success) {
          setTestResult('✅ Connecté!');
        }
      } else {
        // Erreur
        const errorMsg = data.message || 'Échec de la connexion';
        setTestResult(`❌ ${errorMsg}`);

        if (errorMsg.includes('vérifier votre email') || errorMsg.includes('non vérifié')) {
          setVerificationEmail(email);
          setShowVerificationMessage(true);
        } else {
          Alert.alert('Erreur', errorMsg);
        }
      }
    } catch (error: any) {
      setLoginLoading(false);
      const errorMsg = error?.message || 'Erreur réseau';
      setTestResult(`❌ ${errorMsg}`);
      Alert.alert('Erreur', errorMsg);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setResendingEmail(true);
    const result = await authService.resendVerification(verificationEmail);
    setResendingEmail(false);

    if (result.success) {
      Alert.alert('Email envoyé', 'Un nouveau lien de vérification a été envoyé à votre adresse email.');
    } else {
      Alert.alert('Erreur', result.error || "Impossible d'envoyer l'email");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    if (!validators.isValidEmail(forgotPasswordEmail)) {
      Alert.alert('Erreur', validationMessages.email.invalid);
      return;
    }

    setForgotPasswordLoading(true);
    const result = await authService.forgotPassword(forgotPasswordEmail);
    setForgotPasswordLoading(false);

    if (result.success) {
      setForgotPasswordSent(true);
    } else {
      Alert.alert('Erreur', result.error || "Impossible d'envoyer l'email de réinitialisation");
    }
  };

  const [registerLoading, setRegisterLoading] = useState(false);

  const handleRegister = async () => {
    // Empêcher double-click
    if (registerLoading) return;

    // Validation locale
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

    // Démarrer loading
    setRegisterLoading(true);
    setTestResult('Inscription...');

    try {
      // Appel API DIRECT (sans passer par AuthContext)
      const API_URL = 'https://cleanhouse-production.up.railway.app/api';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          phone: phone.replace(/\s/g, '')
        }),
      });

      const data = await response.json();
      setRegisterLoading(false);

      if (response.ok || data.requiresVerification) {
        // SUCCÈS - Alert immédiat puis écran vérification
        const userEmail = email;
        Alert.alert(
          'Inscription réussie!',
          'Vérifiez votre email pour activer votre compte.',
          [{
            text: 'OK',
            onPress: () => {
              setVerificationEmail(userEmail);
              setShowVerificationMessage(true);
            }
          }]
        );
        setTestResult('✅ OK!');
      } else {
        // Erreur serveur
        setTestResult(`❌ ${data.message}`);
        Alert.alert('Erreur', data.message || "Échec de l'inscription");
      }
    } catch (error: any) {
      setRegisterLoading(false);
      setTestResult(`❌ ${error.message}`);
      Alert.alert('Erreur', error.message || 'Erreur réseau');
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Info', 'Google Sign-In sera implémenté prochainement');
  };

  const handleAppleLogin = async () => {
    Alert.alert('Info', 'Apple Sign-In sera implémenté prochainement');
  };

  // Test de connexion API direct - teste plusieurs endpoints
  const [testCount, setTestCount] = useState(0);

  const testConnection = async () => {
    const API_URL = 'https://cleanhouse-production.up.railway.app/api';
    const testNum = testCount + 1;
    setTestCount(testNum);

    // Alterne entre différents tests
    if (testNum % 3 === 1) {
      // Test 1: Simple GET (ou POST login)
      setTestResult('Test 1: /auth/login...');
      try {
        const r = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'x@x.com', password: 'x' }),
        });
        const d = await r.json();
        setTestResult(`T1 ✅ login: ${r.status} - ${d.message}`);
      } catch (e: any) {
        setTestResult(`T1 ❌ login: ${e.message}`);
      }
    } else if (testNum % 3 === 2) {
      // Test 2: Register avec fetch
      setTestResult('Test 2: /auth/register (fetch)...');
      try {
        const r = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `t${Date.now()}@t.com`,
            password: 'Test1234!',
            name: 'Test',
            phone: '0600000000'
          }),
        });
        const d = await r.json();
        setTestResult(`T2 ✅ register fetch: ${r.status} - ${d.message || 'OK'}`);
      } catch (e: any) {
        setTestResult(`T2 ❌ register fetch: ${e.message}`);
      }
    } else {
      // Test 3: Register avec XMLHttpRequest
      setTestResult('Test 3: /auth/register (XHR)...');
      const xhr = new XMLHttpRequest();
      xhr.timeout = 60000;
      xhr.onload = () => {
        try {
          const d = JSON.parse(xhr.responseText);
          setTestResult(`T3 ✅ register XHR: ${xhr.status} - ${d.message || 'OK'}`);
        } catch {
          setTestResult(`T3 ✅ register XHR: ${xhr.status} - ${xhr.responseText.substring(0,50)}`);
        }
      };
      xhr.onerror = () => setTestResult(`T3 ❌ register XHR error: ${xhr.status}`);
      xhr.ontimeout = () => setTestResult(`T3 ❌ register XHR timeout`);
      xhr.open('POST', `${API_URL}/auth/register`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        email: `t${Date.now()}@t.com`,
        password: 'Test1234!',
        name: 'Test',
        phone: '0600000000'
      }));
    }
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
            {/* Version debug */}
            <TouchableOpacity onPress={testConnection} style={styles.debugBanner}>
              <Text style={styles.debugText}>
                {APP_BUILD_VERSION} | Tap pour tester API
              </Text>
              {testResult && <Text style={styles.debugResult}>{testResult}</Text>}
            </TouchableOpacity>

            {/* Logo et titre */}
            <View style={styles.headerSection}>
              <FontAwesome5 name="magic" size={40} color="#FFD700" style={styles.logoIcon} />
              <Text style={styles.logoText}>CLEANHOME</Text>
              <Text style={styles.subtitle}>Services de ménage à Paris</Text>
            </View>

            {/* Message de vérification email */}
            {showVerificationMessage ? (
              <View style={styles.verificationSection}>
                <FontAwesome5 name="envelope" size={60} color="#fff" style={styles.verificationIcon} />
                <Text style={styles.verificationTitle}>Vérifiez votre email</Text>
                <Text style={styles.verificationText}>
                  Un email de vérification a été envoyé à{'\n'}
                  <Text style={styles.verificationEmail}>{verificationEmail}</Text>
                </Text>
                <Text style={styles.verificationSubtext}>
                  Cliquez sur le lien dans l'email pour activer votre compte.
                </Text>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendVerification}
                  disabled={resendingEmail}
                >
                  {resendingEmail ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.resendButtonText}>Renvoyer l'email</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={() => {
                    setShowVerificationMessage(false);
                    setIsLogin(true);
                  }}
                >
                  <Text style={styles.backToLoginText}>Retour à la connexion</Text>
                </TouchableOpacity>
              </View>
            ) : showForgotPassword ? (
              /* Formulaire mot de passe oublié */
              <View style={styles.verificationSection}>
                {forgotPasswordSent ? (
                  <>
                    <FontAwesome5 name="check-circle" size={60} color="#4CAF50" style={styles.verificationIcon} />
                    <Text style={styles.verificationTitle}>Email envoyé !</Text>
                    <Text style={styles.verificationText}>
                      Un email de réinitialisation a été envoyé à{'\n'}
                      <Text style={styles.verificationEmail}>{forgotPasswordEmail}</Text>
                    </Text>
                    <Text style={styles.verificationSubtext}>
                      Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
                    </Text>
                    <TouchableOpacity
                      style={styles.backToLoginButton}
                      onPress={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSent(false);
                        setForgotPasswordEmail('');
                      }}
                    >
                      <Text style={styles.backToLoginText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <FontAwesome5 name="key" size={60} color="#fff" style={styles.verificationIcon} />
                    <Text style={styles.verificationTitle}>Mot de passe oublié</Text>
                    <Text style={styles.verificationSubtext}>
                      Entrez votre adresse email pour recevoir un lien de réinitialisation.
                    </Text>

                    <View style={[styles.inputContainer, { width: '100%', marginTop: 20 }]}>
                      <FontAwesome5 name="envelope" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="exemple@email.com"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={forgotPasswordEmail}
                        onChangeText={setForgotPasswordEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      disabled={forgotPasswordLoading}
                      activeOpacity={0.8}
                      style={[styles.primaryButtonContainer, { width: '100%', marginTop: 16 }]}
                    >
                      <LinearGradient
                        colors={Colors.gradient}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={[styles.primaryButton, forgotPasswordLoading && styles.buttonDisabled]}
                      >
                        {forgotPasswordLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>ENVOYER</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backToLoginButton}
                      onPress={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                      }}
                    >
                      <Text style={styles.backToLoginText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
            /* Formulaire */
            <View style={styles.formSection}>
              {/* Champs d'inscription uniquement */}
              {!isLogin && (
                <>
                  <View style={styles.inputContainer}>
                    <FontAwesome5 name="user" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                    <FontAwesome5 name="mobile-alt" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                <FontAwesome5 name="envelope" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                <FontAwesome5 name="lock" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                  <FontAwesome5 name="lock" size={18} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
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
                onPress={isLogin ? handleLogin : handleRegister}
                disabled={isLogin ? loginLoading : registerLoading}
                activeOpacity={0.8}
                style={styles.primaryButtonContainer}
              >
                <LinearGradient
                  colors={Colors.gradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[styles.primaryButton, (isLogin ? loginLoading : registerLoading) && styles.buttonDisabled]}
                >
                  {(isLogin ? loginLoading : registerLoading) ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isLogin ? 'SE CONNECTER' : "S'INSCRIRE"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Mot de passe oublié */}
              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => setShowForgotPassword(true)}
                >
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
            )}
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
  debugBanner: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  debugText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugResult: {
    color: '#000',
    fontSize: 11,
    marginTop: 4,
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  primaryButtonContainer: {
    marginTop: 8,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'Colors.primaryLight',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationSection: {
    alignItems: 'center',
    padding: 20,
  },
  verificationIcon: {
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  verificationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  verificationEmail: {
    fontWeight: 'bold',
    color: 'Colors.primaryLight',
  },
  verificationSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  resendButton: {
    backgroundColor: 'Colors.primary',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    paddingVertical: 10,
  },
  backToLoginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});

export default AuthScreen;

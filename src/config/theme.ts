// Système de thème centralisé pour CleanHouse

export const Colors = {
  // Couleur principale (Vert professionnel)
  primary: '#2E7D5F',
  primaryDark: '#1B5E4A',
  primaryLight: '#4CAF7D',
  primaryBackground: '#F8EDF9',
  primaryPastel: '#D9A8E0',

  // Couleur secondaire (Violet foncé)
  secondary: '#6B2D8B',
  secondaryDark: '#4A1F61',
  secondaryLight: '#8B3DAB',
  secondaryBackground: '#F3E5F5',
  secondaryPastel: '#C98FD4',

  // Dégradé principal : vert foncé → vert → vert clair
  gradient: ['#1B5E4A', '#2E7D5F', '#4CAF7D'] as const,

  // Dégradé secondaire
  gradientSecondary: ['#1B5E4A', '#2E7D5F', '#4CAF7D'] as const,

  // Texte
  text: {
    primary: '#333',
    secondary: '#666',
    tertiary: '#999',
    inverse: '#fff',
  },

  // Arrière-plans
  background: {
    primary: '#fff',
    secondary: '#F5F5F5',
    card: '#fff',
  },

  // Bordures
  border: {
    light: '#E0E0E0',
    medium: '#ccc',
  },

  // États/Feedback
  status: {
    success: '#4CAF50',
    error: '#e74c3c',
    warning: '#FF6B6B',
    info: '#2196F3',
  },

  // Ombres
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.15)',
  },
};

// Espacements
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Rayons de bordure
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Typographie
export const Typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Ombres communes
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

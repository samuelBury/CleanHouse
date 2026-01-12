// Système de thème centralisé pour CleanHouse

export const Colors = {
  // Couleur principale (Violet)
  primary: '#85409D',
  primaryDark: '#5E2D6F',
  primaryLight: '#A668BE',
  primaryBackground: '#F4E9F8',
  primaryPastel: '#DBC4E8',

  // Couleur secondaire (Violet)
  secondary: '#85409D',
  secondaryDark: '#5E2D6F',
  secondaryLight: '#A668BE',
  secondaryBackground: '#F4E9F8',
  secondaryPastel: '#DBC4E8',

  // Dégradé principal (pour les boutons)
  gradient: ['#5E2D6F', '#85409D', '#A668BE'] as const,

  // Dégradé secondaire (violet)
  gradientSecondary: ['#5E2D6F', '#85409D', '#A668BE'] as const,

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
    success: '#A668BE',
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

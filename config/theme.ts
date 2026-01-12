// Système de thème centralisé pour CleanHouse

export const Colors = {
  // Couleur principale
  primary: '#4cb04f',      // Vert sauge

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
  },

  // Accents
  accent: {
    peach: '#ffe5d9',
    lightGreen: '#c5f2d8',
    darkGreen: '#2D5F4A',
  },

  // Gradients (pour les modals)
  gradients: {
    primary: ['#9AB8AC', '#789C8D', '#5A7D70'] as const,
  },
};

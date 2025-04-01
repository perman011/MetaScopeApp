export const COLORS = {
  // Primary colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  
  // Secondary colors
  secondary: '#64748b',
  secondaryDark: '#475569',
  secondaryLight: '#94a3b8',
  
  // Accent colors
  accent: '#8b5cf6', // Purple
  success: '#10b981', // Green
  warningColor: '#f59e0b', // Amber
  error: '#ef4444',   // Red
  infoColor: '#0ea5e9',    // Sky Blue
  
  // Background colors
  background: '#f5f8fa',
  card: '#ffffff',
  
  // Text colors
  text: '#334155',
  textLight: '#64748b',
  textExtraLight: '#94a3b8',
  textDark: '#1e293b',
  
  // Border colors
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  
  // Status colors for security issues
  critical: '#ef4444',
  criticalBg: '#fef2f2',
  criticalText: '#b91c1c',
  
  warning: {
    main: '#f59e0b',
    bg: '#fffbeb',
    text: '#b45309',
  },
  
  info: {
    main: '#0ea5e9',
    bg: '#f0f9ff',
    text: '#0369a1',
  },
  
  // Miscellaneous
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
};

export default {
  COLORS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
};
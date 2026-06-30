// UniPilot Design System

export const Colors = {
  // Brand
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A43CC',
  secondary: '#FF6584',
  accent: '#43E97B',

  // Semantic
  success: '#43E97B',
  warning: '#FFB347',
  danger: '#FF5252',
  info: '#4FC3F7',

  // Neutrals - Light Mode
  light: {
    background: '#F8F9FF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8EAF6',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    tabBar: '#FFFFFF',
    card: '#FFFFFF',
    input: '#F3F4F6',
    inputBorder: '#E5E7EB',
    placeholder: '#9CA3AF',
    divider: '#F3F4F6',
  },

  // Neutrals - Dark Mode
  dark: {
    background: '#0F0E1A',
    surface: '#1A1929',
    surfaceElevated: '#22213A',
    border: '#2D2B4E',
    text: '#F0EFFF',
    textSecondary: '#A0A0C0',
    textTertiary: '#6B6B8A',
    tabBar: '#1A1929',
    card: '#1A1929',
    input: '#22213A',
    inputBorder: '#2D2B4E',
    placeholder: '#6B6B8A',
    divider: '#22213A',
  },

  // Module colors
  moduleColors: [
    '#6C63FF', // Purple
    '#FF6584', // Pink
    '#43E97B', // Green
    '#FFB347', // Orange
    '#4FC3F7', // Blue
    '#FF8A65', // Deep Orange
    '#BA68C8', // Light Purple
    '#4DB6AC', // Teal
    '#F06292', // Pink 2
    '#AED581', // Light Green
  ],
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const priorityColors = {
  Low: '#43E97B',
  Medium: '#FFB347',
  High: '#FF8C00',
  Critical: '#FF5252',
};

export const statusColors = {
  'Not Started': '#9CA3AF',
  'In Progress': '#4FC3F7',
  'Completed': '#43E97B',
  'Overdue': '#FF5252',
};

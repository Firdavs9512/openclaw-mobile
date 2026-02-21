export const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  border: '#E0E0E0',
  primary: '#1976D2',
  primaryLight: '#E3F2FD',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  success: '#388E3C',
  successLight: '#E8F5E9',

  // Chat specific
  userBubble: '#E3F2FD',
  userBubbleText: '#212121',
  assistantBubble: '#F5F5F5',
  assistantBubbleText: '#212121',
  inputBar: '#FAFAFA',
  inputBorder: '#E0E0E0',

  // Code block
  codeBackground: '#F8F8F8',
  codeText: '#212121',

  // Status
  statusConnected: '#4CAF50',
  statusConnecting: '#FF9800',
  statusDisconnected: '#F44336',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  background: '#1A1A2E',
  surface: '#16162A',
  card: '#222240',
  text: '#E0E0E0',
  textSecondary: '#9E9E9E',
  textTertiary: '#757575',
  border: '#333355',
  primary: '#64B5F6',
  primaryLight: '#1E3A5F',
  error: '#EF5350',
  errorLight: '#3D1A1A',
  warning: '#FFB74D',
  warningLight: '#3D2E1A',
  success: '#66BB6A',
  successLight: '#1A3D1A',

  userBubble: '#1E3A5F',
  userBubbleText: '#E0E0E0',
  assistantBubble: '#2A2A3E',
  assistantBubbleText: '#E0E0E0',
  inputBar: '#16162A',
  inputBorder: '#333355',

  codeBackground: '#1E1E2E',
  codeText: '#E0E0E0',

  statusConnected: '#66BB6A',
  statusConnecting: '#FFB74D',
  statusDisconnected: '#EF5350',
};

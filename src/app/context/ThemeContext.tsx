import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    cardBackground: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkTheme = {
  background: '#0F0F1A',
  cardBackground: '#1A1A2E',
  accent: '#6C63FF',
  text: '#FFFFFF',
  textSecondary: '#A0A3B1',
  border: 'rgba(255, 255, 255, 0.08)',
  success: '#00D9A6',
  error: '#FF4C6A',
  warning: '#FFB830',
};

const lightTheme = {
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  accent: '#6C63FF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: 'rgba(0, 0, 0, 0.1)',
  success: '#00D9A6',
  error: '#FF4C6A',
  warning: '#FFB830',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

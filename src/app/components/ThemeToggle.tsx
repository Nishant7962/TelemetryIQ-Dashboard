import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full flex items-center cursor-pointer transition-all duration-300"
      style={{
        background: theme === 'dark' ? '#6C63FF' : '#FFB830',
        boxShadow: theme === 'dark' 
          ? '0 0 20px rgba(108, 99, 255, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          : '0 0 20px rgba(255, 184, 48, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-white flex items-center justify-center"
        animate={{
          x: theme === 'dark' ? 2 : 30,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-indigo-600" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  );
}

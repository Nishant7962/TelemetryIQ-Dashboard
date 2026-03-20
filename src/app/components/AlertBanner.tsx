import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertBannerProps {
  message: string;
  onDismiss: () => void;
  isVisible: boolean;
}

export function AlertBanner({ message, onDismiss, isVisible }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-hidden relative"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 76, 106, 0.25) 0%, rgba(255, 76, 106, 0.15) 100%)',
            borderLeft: '6px solid #FF4C6A',
            boxShadow: '0 4px 20px rgba(255, 76, 106, 0.3), inset 0 1px 0 rgba(255, 76, 106, 0.4)',
          }}
        >
          {/* Animated pulse background */}
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(ellipse at left, rgba(255, 76, 106, 0.3) 0%, transparent 50%)',
            }}
          />
          <div className="px-8 py-2 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: '#FF4C6A', filter: 'drop-shadow(0 0 8px rgba(255, 76, 106, 0.8))' }} />
              </motion.div>
              <span className="font-semibold text-white text-sm" style={{ textShadow: '0 2px 8px rgba(255, 76, 106, 0.5)' }}>
                 ALERT: {message}
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
              style={{
                background: 'rgba(255, 76, 106, 0.2)',
                border: '1px solid rgba(255, 76, 106, 0.4)',
              }}
            >
              <X className="w-5 h-5" style={{ color: '#FF4C6A' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
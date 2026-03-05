import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type SnackbarProps = {
  message: string;
  visible: boolean;
  position?: 'top-center' | 'bottom-center';
  styleClassName?: string;
  contentStyle?: CSSProperties;
};

export const Snackbar = ({ message, visible, position = 'top-center', styleClassName, contentStyle }: SnackbarProps) => {
  const positionClassName =
    position === 'bottom-center'
      ? 'fixed left-4 right-4 bottom-14 z-50'
      : 'fixed left-4 right-4 top-4 z-50';
  const snackbarStyleClassName =
    styleClassName ?? 'border border-emerald-500/60 bg-emerald-500/35 text-white shadow-lg';
  const verticalOffset = position === 'bottom-center' ? 16 : -16;

  return (
    <AnimatePresence>
      {visible ? (
        <div className={`pointer-events-none ${positionClassName}`}>
          <motion.div
            initial={{ opacity: 0, y: verticalOffset, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: verticalOffset * 0.7, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`min-w-full rounded-md px-3 py-3 text-sm font-medium ${snackbarStyleClassName}`}
            style={contentStyle}
          >
            {message}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useNavigationDir } from './NavigationProvider';

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { getDir, resetDir } = useNavigationDir();
  const dir = getDir(); // 1 = forward (zoom in), -1 = back (zoom out)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: dir === 1 ? 0.96 : 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: dir === 1 ? 1.02 : 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={resetDir}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

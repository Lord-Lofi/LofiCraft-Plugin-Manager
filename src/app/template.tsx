'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigationDir } from '@/components/NavigationProvider';

export default function Template({ children }: { children: ReactNode }) {
  const { getDir, resetDir } = useNavigationDir();
  const dir = getDir();

  return (
    <motion.div
      initial={{ opacity: 0, y: dir === 1 ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={resetDir}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

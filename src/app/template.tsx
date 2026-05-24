'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigationDir } from '@/components/NavigationProvider';

export default function Template({ children }: { children: ReactNode }) {
  const { getDir } = useNavigationDir();
  const dir = getDir();

  return (
    <motion.div
      initial={{ opacity: 0, scale: dir === 1 ? 0.96 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

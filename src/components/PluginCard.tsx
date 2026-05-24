'use client';

import { motion } from 'framer-motion';
import { FileText, User, Tag } from 'lucide-react';
import Link from 'next/link';
import { useNavigationDir } from './NavigationProvider';

export interface PluginCardData {
  id: string;
  name: string;
  version: string;
  description?: string;
  authors: string[];
  hasConfigs: boolean;
}

interface Props {
  plugin: PluginCardData;
  index: number;
}

export default function PluginCard({ plugin, index }: Props) {
  const { getDir } = useNavigationDir();
  const isBack = getDir() === -1;

  return (
    <motion.div
      layoutId={`plugin-card-${plugin.name}`}
      className="group relative flex flex-col rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-colors duration-200 hover:border-[#4ade80]/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.06)] cursor-pointer"
      initial={isBack ? { opacity: 0 } : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: isBack ? 0 : index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
    >
      {/* Subtle top glow on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#4ade80]/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <Link href={`/plugins/${encodeURIComponent(plugin.name)}`} className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <motion.h3
            layoutId={`plugin-name-${plugin.name}`}
            className="truncate text-sm font-semibold text-white"
          >
            {plugin.name}
          </motion.h3>
          <span className="shrink-0 rounded-full bg-[#4ade80]/10 px-2 py-0.5 text-[10px] font-medium text-[#4ade80] ring-1 ring-[#4ade80]/20">
            v{plugin.version}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-[#6b7280]">
          {plugin.description || 'No description provided.'}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-3 text-[11px] text-[#4b5563]">
          {plugin.authors.length > 0 && (
            <span className="flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{plugin.authors.join(', ')}</span>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 shrink-0">
            {plugin.hasConfigs ? (
              <>
                <FileText className="h-3 w-3 text-[#4ade80]" />
                <span className="text-[#4ade80]">configs</span>
              </>
            ) : (
              <>
                <Tag className="h-3 w-3" />
                <span>no configs</span>
              </>
            )}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

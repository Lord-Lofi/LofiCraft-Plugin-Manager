'use client';

import { motion } from 'framer-motion';
import { FileText, User, Tag } from 'lucide-react';
import Link from 'next/link';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Link href={`/plugins/${encodeURIComponent(plugin.name)}`} className="block group h-full">
        <div className="relative flex h-full flex-col rounded-xl border border-[#1e1e1e] bg-[#111111] p-5 transition-all duration-200 hover:border-[#4ade80]/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.06)]">
          {/* Subtle top glow on hover */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-[#4ade80]/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-semibold text-white">{plugin.name}</h3>
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
        </div>
      </Link>
    </motion.div>
  );
}

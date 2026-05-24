'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Tag,
  User,
  Layers,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import ConfigFileTree from '@/components/ConfigFileTree';
import ConfigEditor from '@/components/ConfigEditor';
import ConfirmModal from '@/components/ConfirmModal';
import { useNavigationDir } from '@/components/NavigationProvider';

interface PluginDetail {
  id: string;
  name: string;
  version: string;
  description?: string;
  authors: string[];
  apiVersion?: string;
  depend?: string[];
  softDepend?: string[];
  hasConfigs: boolean;
  configs: string[];
}

const EXPAND_MS = 450;

// Simple dissolve helper — just fades in with a fixed delay from mount
function dissolve(delay = 0) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.35, delay, ease: [0, 0, 0.58, 1] as const },
  };
}

export default function PluginPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const pluginName = decodeURIComponent(name);

  const { setBackward, setGuard, callGuard } = useNavigationDir();

  const [plugin, setPlugin] = useState<PluginDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (isDirty) {
      setGuard((nav) => { setPendingNav(() => nav); setShowLeaveModal(true); });
    } else {
      setGuard(null);
    }
    return () => setGuard(null);
  }, [isDirty, setGuard]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  function guardedBack() {
    callGuard(() => { setBackward(); router.push('/'); });
  }

  const loadPlugin = useCallback(async () => {
    try {
      const res = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PluginDetail = await res.json();
      setPlugin(data);
      if (data.configs.length > 0) setSelectedConfig(data.configs[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pluginName]);

  useEffect(() => { loadPlugin(); }, [loadPlugin]);

  return (
    <>
      <motion.div
        layoutId={`plugin-card-${pluginName}`}
        className="flex flex-1 flex-col overflow-hidden bg-[#111111]"
        transition={{ duration: EXPAND_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Header — always rendered ── */}
        <div className="shrink-0 border-b border-[#1e1e1e] bg-[#0d0d0d] px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-start gap-4">

            {/* Back button — dissolves in after card expansion */}
            <motion.button
              onClick={guardedBack}
              {...dissolve(0.5)}
              className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#9ca3af] transition-all hover:border-[#4ade80]/30 hover:text-[#4ade80]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </motion.button>

            <div className="flex min-w-0 items-center gap-3">
              {/* Green icon — dissolves in after card expansion */}
              <motion.div
                {...dissolve(0.55)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4ade80]/10 ring-1 ring-[#4ade80]/20"
              >
                <Package className="h-5 w-5 text-[#4ade80]" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Title — layoutId flies from card */}
                  <motion.h1
                    layoutId={`plugin-name-${pluginName}`}
                    className="text-base font-bold text-white"
                    transition={{ duration: EXPAND_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {pluginName}
                  </motion.h1>

                  {/* Version badge — dissolves in after API + expansion */}
                  {plugin && (
                    <motion.span {...dissolve(0.4)}
                      className="rounded-full bg-[#4ade80]/10 px-2 py-0.5 text-[10px] font-medium text-[#4ade80] ring-1 ring-[#4ade80]/20"
                    >
                      v{plugin.version}
                    </motion.span>
                  )}
                </div>

                {/* Description — dissolves in after API */}
                {plugin?.description && (
                  <motion.p {...dissolve(0.45)} className="mt-0.5 text-xs text-[#6b7280]">
                    {plugin.description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Meta badges — dissolves in after API */}
            {plugin && (plugin.authors.length > 0 || plugin.apiVersion || plugin.depend?.length) && (
              <motion.div
                {...dissolve(0.5)}
                className="ml-auto hidden flex-wrap items-center gap-3 lg:flex"
              >
                {plugin.authors.length > 0 && (
                  <MetaBadge icon={<User className="h-3 w-3" />} label={plugin.authors.join(', ')} />
                )}
                {plugin.apiVersion && (
                  <MetaBadge icon={<Tag className="h-3 w-3" />} label={`API ${plugin.apiVersion}`} />
                )}
                {plugin.depend && plugin.depend.length > 0 && (
                  <MetaBadge icon={<Layers className="h-3 w-3" />} label={`Depends: ${plugin.depend.join(', ')}`} />
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="relative flex flex-1 overflow-hidden">

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-[#6b7280] pointer-events-none"
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-sm">Loading plugin…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-1 items-center justify-center px-6"
              >
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to load plugin: {error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config sidebar — slides in from left */}
          {plugin && (
            <motion.aside
              initial={{ x: -224, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-56 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#0d0d0d]"
            >
              <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
                <FolderOpen className="h-3.5 w-3.5 text-[#4b5563]" />
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Config Files
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConfigFileTree
                  files={plugin.configs}
                  selected={selectedConfig}
                  onSelect={setSelectedConfig}
                />
              </div>
            </motion.aside>
          )}

          {/* Editor — dissolves in */}
          {plugin && (
            <motion.div
              {...dissolve(0.55)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {selectedConfig ? (
                  <motion.div
                    key={selectedConfig}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex h-full flex-col"
                  >
                    <ConfigEditor
                      pluginName={plugin.name}
                      filename={selectedConfig}
                      onDirtyChange={setIsDirty}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex h-full flex-col items-center justify-center gap-3 text-[#4b5563]"
                  >
                    <FolderOpen className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Select a config file to edit</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ConfirmModal
        open={showLeaveModal}
        title="Unsaved changes"
        message="You have unsaved changes that will be lost. Are you sure you want to leave?"
        onConfirm={() => { setShowLeaveModal(false); pendingNav?.(); }}
        onCancel={() => { setShowLeaveModal(false); setPendingNav(null); }}
      />
    </>
  );
}

function MetaBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 py-1 text-xs text-[#9ca3af]">
      {icon}
      <span className="max-w-[180px] truncate">{label}</span>
    </span>
  );
}

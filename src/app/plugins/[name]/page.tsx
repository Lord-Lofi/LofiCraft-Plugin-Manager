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

// Duration of the card-expansion layoutId animation
const EXPAND_MS = 450;

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
  // True once the card expansion animation has had time to complete
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExpanded(true), EXPAND_MS);
    return () => clearTimeout(t);
  }, []);

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
    callGuard(() => { setBackward(); router.back(); });
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

  // How long to delay body animations after the plugin data arrives,
  // so they don't fire before the card has finished expanding.
  function bodyDelay(extra = 0) {
    // If the card has already finished expanding by the time data loads,
    // start immediately (extra only). Otherwise wait for the remainder.
    return expanded ? extra : (EXPAND_MS / 1000) + extra;
  }

  return (
    <>
      {/* layoutId matches the PluginCard — expands from the grid */}
      <motion.div
        layoutId={`plugin-card-${pluginName}`}
        className="flex flex-1 flex-col overflow-hidden bg-[#111111]"
        transition={{ duration: EXPAND_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Plugin header ── always rendered; pre-API fields appear immediately */}
        <div className="shrink-0 border-b border-[#1e1e1e] bg-[#0d0d0d] px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-start gap-4">

            {/* Back button — dissolves in */}
            <motion.button
              onClick={guardedBack}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#9ca3af] transition-all hover:border-[#4ade80]/30 hover:text-[#4ade80]"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </motion.button>

            <div className="flex min-w-0 items-center gap-3">
              {/* Green icon — dissolves in */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4ade80]/10 ring-1 ring-[#4ade80]/20"
              >
                <Package className="h-5 w-5 text-[#4ade80]" />
              </motion.div>

              <div className="min-w-0">
                {/* Title — layoutId flies from card */}
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.h1
                    layoutId={`plugin-name-${pluginName}`}
                    className="text-base font-bold text-white"
                    transition={{ duration: EXPAND_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {pluginName}
                  </motion.h1>

                  {/* Version badge — wipes in after API */}
                  <AnimatePresence>
                    {plugin && (
                      <motion.span
                        key="version"
                        initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                        animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                        transition={{ duration: 0.3, delay: bodyDelay(0), ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-full bg-[#4ade80]/10 px-2 py-0.5 text-[10px] font-medium text-[#4ade80] ring-1 ring-[#4ade80]/20"
                      >
                        v{plugin.version}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Description — wipes in after API */}
                <AnimatePresence>
                  {plugin?.description && (
                    <motion.p
                      key="desc"
                      initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                      animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                      transition={{ duration: 0.3, delay: bodyDelay(0.05), ease: [0.22, 1, 0.36, 1] }}
                      className="mt-0.5 text-xs text-[#6b7280]"
                    >
                      {plugin.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Meta badges — wipe in from the right after API */}
            <AnimatePresence>
              {plugin && (plugin.authors.length > 0 || plugin.apiVersion || plugin.depend?.length) && (
                <motion.div
                  key="meta"
                  initial={{ opacity: 0, clipPath: 'inset(0 0% 0 100%)' }}
                  animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0%)' }}
                  transition={{ duration: 0.35, delay: bodyDelay(0.1), ease: [0.22, 1, 0.36, 1] }}
                  className="ml-auto hidden flex-wrap items-center gap-3 lg:flex"
                >
                  {plugin.authors.length > 0 && (
                    <MetaBadge icon={<User className="h-3 w-3" />} label={plugin.authors.join(', ')} />
                  )}
                  {plugin.apiVersion && (
                    <MetaBadge icon={<Tag className="h-3 w-3" />} label={`API ${plugin.apiVersion}`} />
                  )}
                  {plugin.depend && plugin.depend.length > 0 && (
                    <MetaBadge
                      icon={<Layers className="h-3 w-3" />}
                      label={`Depends: ${plugin.depend.join(', ')}`}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Loading / error states */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-[#6b7280] pointer-events-none"
                style={{ top: '4.5rem' }}
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-sm">Loading plugin…</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-1 items-center justify-center px-6"
              >
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to load plugin: {error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config sidebar — wipes in from the left */}
          <AnimatePresence>
            {plugin && (
              <motion.aside
                key="sidebar"
                initial={{ x: -224, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: bodyDelay(0.1), ease: [0.22, 1, 0.36, 1] }}
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
          </AnimatePresence>

          {/* Editor pane — dissolves in */}
          <AnimatePresence>
            {plugin && (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: bodyDelay(0.25) }}
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full flex-col items-center justify-center gap-3 text-[#4b5563]"
                    >
                      <FolderOpen className="h-10 w-10 opacity-30" />
                      <p className="text-sm">Select a config file to edit</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
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

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

  // Register / clear navigation guard based on dirty state
  useEffect(() => {
    if (isDirty) {
      setGuard((nav) => {
        setPendingNav(() => nav);
        setShowLeaveModal(true);
      });
    } else {
      setGuard(null);
    }
    return () => setGuard(null);
  }, [isDirty, setGuard]);

  // Browser unload guard
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

  return (
    <>
      {/* layoutId matches the PluginCard — this is what expands from the grid */}
      <motion.div
        layoutId={`plugin-card-${pluginName}`}
        className="flex flex-1 flex-col overflow-hidden bg-[#111111]"
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 items-center justify-center text-[#6b7280]"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Loading plugin…</span>
            </motion.div>
          )}

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

          {!loading && !error && plugin && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Plugin header */}
              <div className="shrink-0 border-b border-[#1e1e1e] bg-[#0d0d0d] px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-start gap-4">
                  <button
                    onClick={guardedBack}
                    className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#9ca3af] transition-all hover:border-[#4ade80]/30 hover:text-[#4ade80]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4ade80]/10 ring-1 ring-[#4ade80]/20">
                      <Package className="h-5 w-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold text-white">{plugin.name}</h1>
                        <span className="rounded-full bg-[#4ade80]/10 px-2 py-0.5 text-[10px] font-medium text-[#4ade80] ring-1 ring-[#4ade80]/20">
                          v{plugin.version}
                        </span>
                      </div>
                      {plugin.description && (
                        <p className="mt-0.5 text-xs text-[#6b7280]">{plugin.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto hidden flex-wrap items-center gap-3 lg:flex">
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
                  </div>
                </div>
              </div>

              {/* Body: sidebar + editor */}
              <div className="flex flex-1 overflow-hidden">
                <aside className="flex w-56 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#0d0d0d]">
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
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

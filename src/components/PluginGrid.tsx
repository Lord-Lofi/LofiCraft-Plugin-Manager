'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import PluginCard, { type PluginCardData } from './PluginCard';

export default function PluginGrid() {
  const [plugins, setPlugins] = useState<PluginCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/plugins')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setPlugins(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Stats + search bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugins</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-[#6b7280]">
              {plugins.length} installed &mdash; {plugins.filter((p) => p.hasConfigs).length} with configs
            </p>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4b5563]" />
          <input
            type="text"
            placeholder="Search plugins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#1e1e1e] bg-[#111111] py-2 pl-9 pr-4 text-sm text-white placeholder-[#4b5563] outline-none transition-all focus:border-[#4ade80]/40 focus:ring-1 focus:ring-[#4ade80]/20 sm:w-64"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-32 text-[#6b7280]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm">Loading plugins…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load plugins: {error}</span>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center text-sm text-[#6b7280]"
        >
          {search ? `No plugins matching "${search}"` : 'No plugins found in the plugins folder.'}
        </motion.div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((plugin, i) => (
            <PluginCard key={plugin.id} plugin={plugin} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

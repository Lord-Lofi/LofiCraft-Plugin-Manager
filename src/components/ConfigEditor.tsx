'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[#6b7280]">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span className="text-sm">Loading editor…</span>
    </div>
  ),
});

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    toml: 'ini',
    conf: 'ini',
    properties: 'ini',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}

interface Props {
  pluginName: string;
  filename: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function ConfigEditor({ pluginName, filename, onDirtyChange }: Props) {
  const [content, setContent] = useState<string>('');
  const [original, setOriginal] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  const filepath = filename.split('/').map(encodeURIComponent).join('/');

  const loadFile = useCallback(async () => {
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/configs/${filepath}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
      setOriginal(text);
    } catch (err) {
      toast.error(`Failed to load ${filename}: ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoadingFile(false);
    }
  }, [pluginName, filename, filepath]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/configs/${filepath}`, {
        method: 'PUT',
        body: content,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOriginal(content);
      toast.success('Config saved');
    } catch (err) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleReload() {
    setReloading(true);
    try {
      const res = await fetch(`/api/plugins/${encodeURIComponent(pluginName)}/reload`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Reload command sent via RCON');
    } catch (err) {
      toast.error(`Reload failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setReloading(false);
    }
  }

  const isDirty = content !== original;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#1e1e1e] bg-[#0d0d0d] px-4 py-2">
        <FileText className="h-3.5 w-3.5 text-[#4ade80]" />
        <span className="flex-1 truncate text-xs text-[#9ca3af] font-mono">{filename}</span>

        <AnimatePresence>
          {isDirty && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-500/20"
            >
              unsaved
            </motion.span>
          )}
        </AnimatePresence>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-1.5 rounded-lg bg-[#4ade80]/10 px-3 py-1.5 text-xs font-medium text-[#4ade80] ring-1 ring-[#4ade80]/20 transition-all hover:bg-[#4ade80]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>

        <button
          onClick={handleReload}
          disabled={reloading}
          className="flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-[#9ca3af] transition-all hover:border-[#4ade80]/30 hover:text-[#4ade80] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reloading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Reload
        </button>
      </div>

      {/* Editor */}
      <div className="relative flex-1 overflow-hidden">
        {loadingFile ? (
          <div className="flex h-full items-center justify-center text-[#6b7280]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <MonacoEditor
            height="100%"
            language={detectLanguage(filename)}
            value={content}
            onChange={(v) => setContent(v ?? '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
          />
        )}
      </div>
    </div>
  );
}

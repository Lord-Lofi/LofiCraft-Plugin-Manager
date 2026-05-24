'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Leave anyway',
  cancelLabel = 'Keep editing',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 shadow-2xl">
              {/* Icon + title */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">{title}</h2>
              </div>

              {/* Message */}
              <p className="mb-6 text-sm leading-relaxed text-[#9ca3af]">{message}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 text-xs font-medium text-[#9ca3af] transition-all hover:border-[#3a3a3a] hover:text-white"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 rounded-lg bg-amber-500/10 py-2 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20 transition-all hover:bg-amber-500/20"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

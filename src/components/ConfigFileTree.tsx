'use client';

import { motion } from 'framer-motion';
import { FileText, Folder, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

function buildTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.find((n) => n.name === name);

      if (existing) {
        current = existing.children ?? [];
      } else {
        const node: TreeNode = {
          name,
          path: parts.slice(0, i + 1).join('/'),
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : [],
        };
        current.push(node);
        current = node.children ?? [];
      }
    }
  }

  return root;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
}

function TreeItem({ node, depth, selected, onSelect }: TreeItemProps) {
  const [open, setOpen] = useState(true);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]"
          style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        >
          <ChevronRight
            className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          />
          <Folder className="h-3 w-3 shrink-0 text-amber-500/60" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const isSelected = selected === node.path;

  return (
    <motion.button
      onClick={() => onSelect(node.path)}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-all ${
        isSelected
          ? 'bg-[#4ade80]/10 text-[#4ade80] ring-1 ring-[#4ade80]/20'
          : 'text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-white'
      }`}
      style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
    >
      <FileText className={`h-3 w-3 shrink-0 ${isSelected ? 'text-[#4ade80]' : 'text-[#4b5563]'}`} />
      <span className="truncate">{node.name}</span>
    </motion.button>
  );
}

interface Props {
  files: string[];
  selected: string | null;
  onSelect: (path: string) => void;
}

export default function ConfigFileTree({ files, selected, onSelect }: Props) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <FileText className="h-8 w-8 text-[#2a2a2a]" />
        <p className="text-xs text-[#4b5563]">No config files found</p>
      </div>
    );
  }

  return (
    <nav className="py-2">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

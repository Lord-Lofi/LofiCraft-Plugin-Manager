'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/10 ring-1 ring-[#4ade80]/20 transition-all group-hover:bg-[#4ade80]/20 group-hover:ring-[#4ade80]/40">
            <Package className="h-4 w-4 text-[#4ade80]" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            LofiCraft <span className="text-[#4ade80]">Panel</span>
          </span>
        </Link>
        <div className="ml-auto text-xs text-[#6b7280]">Minecraft Plugin Manager</div>
      </div>
    </header>
  );
}

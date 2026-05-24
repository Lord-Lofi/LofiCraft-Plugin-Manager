'use client';

import { Package } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationDir } from './NavigationProvider';

interface Props {
  onNavigateAway?: (nav: () => void) => void;
}

export default function Navbar({ onNavigateAway }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { setBackward } = useNavigationDir();

  function handleHomeClick(e: React.MouseEvent) {
    if (pathname === '/') return;
    e.preventDefault();
    const nav = () => { setBackward(); router.push('/'); };
    if (onNavigateAway) {
      onNavigateAway(nav);
    } else {
      nav();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e1e] bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
        <a href="/" onClick={handleHomeClick} className="flex items-center gap-3 group cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ade80]/10 ring-1 ring-[#4ade80]/20 transition-all group-hover:bg-[#4ade80]/20 group-hover:ring-[#4ade80]/40">
            <Package className="h-4 w-4 text-[#4ade80]" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            LofiCraft <span className="text-[#4ade80]">Panel</span>
          </span>
        </a>
        <div className="ml-auto text-xs text-[#6b7280]">Minecraft Plugin Manager</div>
      </div>
    </header>
  );
}

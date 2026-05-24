'use client';

import { useEffect } from 'react';
import PluginGrid from '@/components/PluginGrid';
import { useNavigationDir } from '@/components/NavigationProvider';

export default function Home() {
  const { resetDir } = useNavigationDir();

  // Reset direction when the list page mounts so the next forward nav is correct
  useEffect(() => { resetDir(); }, [resetDir]);

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <PluginGrid />
      </main>
    </div>
  );
}

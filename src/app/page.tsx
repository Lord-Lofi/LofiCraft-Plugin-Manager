import Navbar from '@/components/Navbar';
import PluginGrid from '@/components/PluginGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <PluginGrid />
      </main>
    </div>
  );
}

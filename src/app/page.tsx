import PluginGrid from '@/components/PluginGrid';

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <PluginGrid />
      </main>
    </div>
  );
}

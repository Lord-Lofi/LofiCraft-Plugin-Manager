import { NextResponse } from 'next/server';
import { getPlugin, getConfigFiles } from '@/lib/plugin-reader';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) {
    return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
  }
  const configs = getConfigFiles(plugin);
  return NextResponse.json({ ...plugin, configs });
}

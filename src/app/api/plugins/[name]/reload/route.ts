import { NextResponse } from 'next/server';
import { getPlugin } from '@/lib/plugin-reader';
import { sendReloadCommand } from '@/lib/rcon';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });

  try {
    const response = await sendReloadCommand(plugin.name);
    return NextResponse.json({ ok: true, response });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'RCON connection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

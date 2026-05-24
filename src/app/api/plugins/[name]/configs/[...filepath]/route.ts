import { NextResponse } from 'next/server';
import { getPlugin, readConfigFile, writeConfigFile } from '@/lib/plugin-reader';

type Params = Promise<{ name: string; filepath: string[] }>;

function joinFilepath(filepath: string[]): string {
  return filepath.map(decodeURIComponent).join('/');
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { name, filepath } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });

  try {
    const content = readConfigFile(plugin, joinFilepath(filepath));
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const { name, filepath } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });

  try {
    const content = await req.text();
    writeConfigFile(plugin, joinFilepath(filepath), content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const code = (err as NodeJS.ErrnoException).code;
    console.error(`[write] ${plugin.name}/${joinFilepath(filepath)} — ${code ?? ''} ${message}`);
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}

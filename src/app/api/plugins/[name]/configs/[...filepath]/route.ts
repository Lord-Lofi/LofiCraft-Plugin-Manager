import { NextResponse } from 'next/server';
import {
  ConfigError,
  MAX_CONFIG_BYTES,
  getPlugin,
  readConfigFile,
  writeConfigFile,
} from '@/lib/plugin-reader';

type Params = Promise<{ name: string; filepath: string[] }>;

function joinFilepath(filepath: string[]): string {
  return filepath.map(decodeURIComponent).join('/');
}

function errorResponse(err: unknown, action: string, label: string) {
  if (err instanceof ConfigError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const code = (err as NodeJS.ErrnoException).code;
  console.error(`[${action}] ${label} - ${code ?? ''} ${err instanceof Error ? err.message : err}`);
  const message =
    code === 'EACCES' || code === 'EPERM'
      ? 'Permission denied. Check that PUID/PGID own the plugins folder.'
      : `Could not ${action} the file`;
  return NextResponse.json({ error: message, code }, { status: 500 });
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { name, filepath } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });

  const file = joinFilepath(filepath);
  try {
    return new Response(readConfigFile(plugin, file), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return errorResponse(err, 'read', `${plugin.name}/${file}`);
  }
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const { name, filepath } = await params;
  const plugin = getPlugin(decodeURIComponent(name));
  if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_CONFIG_BYTES) {
    return NextResponse.json({ error: 'File is too large to save' }, { status: 413 });
  }

  const file = joinFilepath(filepath);
  try {
    writeConfigFile(plugin, file, await req.text());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, 'save', `${plugin.name}/${file}`);
  }
}

import { NextResponse } from 'next/server';
import { getAllPlugins } from '@/lib/plugin-reader';

export async function GET() {
  try {
    const plugins = getAllPlugins();
    return NextResponse.json(plugins);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

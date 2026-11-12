import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';

const PLUGINS_DIR = process.env.PLUGINS_DIR || '/plugins';

const CONFIG_EXTENSIONS = new Set(['.yml', '.yaml', '.json', '.toml', '.conf', '.properties', '.txt']);

// plugin.yml files are a few KB. Refuse to unpack anything much bigger, so a
// crafted jar in the plugins folder can't exhaust memory (zip bomb).
const MAX_PLUGIN_YML_BYTES = 1024 * 1024;

export interface PluginInfo {
  id: string;
  jarFile: string;
  name: string;
  version: string;
  description?: string;
  authors: string[];
  apiVersion?: string;
  depend?: string[];
  softDepend?: string[];
  configDir?: string;
  hasConfigs: boolean;
}

function extractPluginYml(jarPath: string): Record<string, unknown> | null {
  try {
    const zip = new AdmZip(jarPath);
    const entry =
      zip.getEntry('plugin.yml') ??
      zip.getEntry('paper-plugin.yml') ??
      zip.getEntry('bungee.yml');
    if (!entry || entry.header.size > MAX_PLUGIN_YML_BYTES) return null;
    const data = entry.getData();
    if (data.length > MAX_PLUGIN_YML_BYTES) return null;
    return yaml.load(data.toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveAuthors(info: Record<string, unknown>): string[] {
  if (Array.isArray(info.authors)) return info.authors as string[];
  if (typeof info.author === 'string') return [info.author];
  return [];
}

export function getPluginsDir(): string {
  return PLUGINS_DIR;
}

export function getAllPlugins(): PluginInfo[] {
  let files: string[];
  try {
    files = fs.readdirSync(PLUGINS_DIR);
  } catch {
    return [];
  }

  return files
    .filter((f) => f.endsWith('.jar'))
    .map((file) => {
      const jarPath = path.join(PLUGINS_DIR, file);
      const id = file.slice(0, -4);
      const info = extractPluginYml(jarPath);
      const name = (info?.name as string) || id;
      const configDirPath = path.join(PLUGINS_DIR, name);
      const hasConfigs =
        fs.existsSync(configDirPath) && fs.statSync(configDirPath).isDirectory();

      return {
        id,
        jarFile: file,
        name,
        version: (info?.version as string) || 'Unknown',
        description: info?.description as string | undefined,
        authors: info ? resolveAuthors(info) : [],
        apiVersion: info?.['api-version'] as string | undefined,
        depend: info?.depend as string[] | undefined,
        softDepend: info?.softdepend as string[] | undefined,
        configDir: hasConfigs ? configDirPath : undefined,
        hasConfigs,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getPlugin(nameOrId: string): PluginInfo | null {
  return getAllPlugins().find((p) => p.name === nameOrId || p.id === nameOrId) ?? null;
}

function scanConfigFiles(dir: string, prefix = ''): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...scanConfigFiles(fullPath, `${prefix}${entry}/`));
    } else if (CONFIG_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
      results.push(`${prefix}${entry}`);
    }
  }
  return results;
}

export function getConfigFiles(plugin: PluginInfo): string[] {
  if (!plugin.configDir) return [];
  try {
    return scanConfigFiles(plugin.configDir);
  } catch {
    return [];
  }
}

function safeConfigPath(plugin: PluginInfo, filename: string): string {
  if (!plugin.configDir) throw new Error('Plugin has no config directory');
  const resolved = path.resolve(plugin.configDir, filename);
  if (!resolved.startsWith(path.resolve(plugin.configDir) + path.sep)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

export function readConfigFile(plugin: PluginInfo, filename: string): string {
  return fs.readFileSync(safeConfigPath(plugin, filename), 'utf8');
}

export function writeConfigFile(plugin: PluginInfo, filename: string, content: string): void {
  const target = safeConfigPath(plugin, filename);
  // Ensure the directory exists (plugin may not have created it yet)
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

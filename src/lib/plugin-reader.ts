import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';

const PLUGINS_DIR = process.env.PLUGINS_DIR || '/plugins';

// Only these file types are listed, read and saved. Anything else in a
// plugin's folder (scripts, jars, databases) can't be touched from the panel.
const CONFIG_EXTENSIONS = new Set(['.yml', '.yaml', '.json', '.toml', '.conf', '.properties', '.txt']);

// plugin.yml files are a few KB. Refuse to unpack anything much bigger, so a
// crafted jar in the plugins folder can't exhaust memory (zip bomb).
const MAX_PLUGIN_YML_BYTES = 1024 * 1024;

// Largest config file the panel will save.
export const MAX_CONFIG_BYTES = 2 * 1024 * 1024;

// Plugin names come from inside the jar, so they're untrusted. They are used
// as a folder name and in the RCON reload command, so only allow the
// characters Bukkit/Paper itself allows in plugin names.
const SAFE_PLUGIN_NAME = /^[A-Za-z0-9 _.-]{1,64}$/;

export class ConfigError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

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
    const parsed = yaml.load(data.toString('utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === 'string');
}

function resolveAuthors(info: Record<string, unknown>): string[] {
  return asStringList(info.authors) ?? (typeof info.author === 'string' ? [info.author] : []);
}

// Returns the plugin's config folder only if it is a real directory directly
// inside the plugins folder (not a symlink pointing somewhere else).
function configDirFor(name: string): string | undefined {
  if (!SAFE_PLUGIN_NAME.test(name) || name === '.' || name === '..') return undefined;
  const dir = path.join(PLUGINS_DIR, name);
  try {
    const stat = fs.lstatSync(dir);
    if (!stat.isDirectory()) return undefined;
    if (path.dirname(fs.realpathSync(dir)) !== fs.realpathSync(PLUGINS_DIR)) return undefined;
    return dir;
  } catch {
    return undefined;
  }
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
      const declaredName = asString(info?.name);
      // Fall back to the jar's file name if plugin.yml's name is unsafe
      const name = declaredName && SAFE_PLUGIN_NAME.test(declaredName) ? declaredName : id;
      const configDir = configDirFor(name);

      return {
        id,
        jarFile: file,
        name,
        version: asString(info?.version) ?? 'Unknown',
        description: asString(info?.description),
        authors: info ? resolveAuthors(info) : [],
        apiVersion: asString(info?.['api-version']),
        depend: asStringList(info?.depend),
        softDepend: asStringList(info?.softdepend),
        configDir,
        hasConfigs: configDir !== undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getPlugin(nameOrId: string): PluginInfo | null {
  return getAllPlugins().find((p) => p.name === nameOrId || p.id === nameOrId) ?? null;
}

// Lists config files, skipping symlinks so nothing outside the plugin's
// folder is ever listed (and symlink loops can't hang the scan).
function scanConfigFiles(dir: string, prefix = '', depth = 0): string[] {
  if (depth > 8) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...scanConfigFiles(fullPath, `${prefix}${entry}/`, depth + 1));
    } else if (stat.isFile() && CONFIG_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
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

// Turns a requested file name into a path to an existing config file inside
// the plugin's folder, or refuses. Checks, in order:
//   - the file type is an allowed config type
//   - the path stays inside the folder (no "../")
//   - after following symlinks, the real file is still inside the folder
//   - it is an existing regular file (the panel edits files, never creates them)
function safeConfigPath(plugin: PluginInfo, filename: string): string {
  if (!plugin.configDir) throw new ConfigError('Plugin has no config directory', 404);
  if (!CONFIG_EXTENSIONS.has(path.extname(filename).toLowerCase())) {
    throw new ConfigError('This file type cannot be edited', 400);
  }
  const root = path.resolve(plugin.configDir);
  const resolved = path.resolve(root, filename);
  if (!resolved.startsWith(root + path.sep)) {
    throw new ConfigError('Invalid file path', 400);
  }
  let real: string;
  try {
    real = fs.realpathSync(resolved);
  } catch {
    throw new ConfigError('File not found', 404);
  }
  const realRoot = fs.realpathSync(root);
  if (!real.startsWith(realRoot + path.sep) || !fs.statSync(real).isFile()) {
    throw new ConfigError('Invalid file path', 400);
  }
  return real;
}

export function readConfigFile(plugin: PluginInfo, filename: string): string {
  return fs.readFileSync(safeConfigPath(plugin, filename), 'utf8');
}

export function writeConfigFile(plugin: PluginInfo, filename: string, content: string): void {
  if (Buffer.byteLength(content, 'utf8') > MAX_CONFIG_BYTES) {
    throw new ConfigError('File is too large to save', 413);
  }
  fs.writeFileSync(safeConfigPath(plugin, filename), content, 'utf8');
}

import { rconCommand } from './rcon-protocol';

const RCON_HOST = process.env.RCON_HOST || 'host.docker.internal';
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';
const RCON_RELOAD_COMMAND = process.env.RCON_RELOAD_COMMAND || 'reload confirm';

// Sends the configured reload command (with %plugin% replaced by the
// plugin's name, which plugin-reader has already checked) and returns the
// server's reply.
export async function sendReloadCommand(pluginName: string): Promise<string> {
  const command = RCON_RELOAD_COMMAND.replace(/%plugin%/gi, pluginName);
  return rconCommand({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
    command,
  });
}

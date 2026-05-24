import { Rcon } from 'rcon-client';

const RCON_HOST = process.env.RCON_HOST || 'host.docker.internal';
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';
const RCON_RELOAD_COMMAND = process.env.RCON_RELOAD_COMMAND || 'reload confirm';

export async function sendReloadCommand(pluginName: string): Promise<string> {
  const command = RCON_RELOAD_COMMAND.replace(/%plugin%/gi, pluginName);

  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
    timeout: 5000,
  });

  try {
    const response = await rcon.send(command);
    return response;
  } finally {
    rcon.end();
  }
}

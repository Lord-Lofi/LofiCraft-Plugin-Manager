// A minimal RCON client, written for this panel instead of using a package.
//
// RCON is the "remote console" protocol (from Valve's Source engine) that
// Minecraft servers use. The panel only ever needs to: connect, log in with
// the password, send one command, read the reply and disconnect.
//
// Every message, both ways, is one packet (all numbers little-endian):
//
//   int32  length    bytes that follow this field
//   int32  id        chosen by the client; the reply carries the same id
//   int32  type      3 = log in, 2 = run command (also "login reply"), 0 = reply
//   bytes  body      text, followed by a 0 byte
//   byte   0         one more 0 byte (empty second string)
//
// A failed login is answered with id -1. Minecraft splits long replies into
// several packets of up to 4096 bytes of text each.
//
// Uses only Node's built-in "net" module, no dependencies.
import * as net from 'node:net';

const TYPE_AUTH = 3;
const TYPE_COMMAND = 2;
const TYPE_AUTH_RESPONSE = 2;
const TYPE_RESPONSE = 0;

// Minecraft refuses command packets with a body over 1446 bytes
export const MAX_COMMAND_BYTES = 1446;
// Minecraft sends at most this much text per reply packet
const MAX_REPLY_FRAGMENT = 4096;
// A reply can't sensibly be larger than this; stop reading past it
const MAX_REPLY_BYTES = 1024 * 1024;

export interface RconOptions {
  host: string;
  port: number;
  password: string;
  command: string;
  /** Connecting and logging in (ms) */
  connectTimeout?: number;
  /** Waiting for the command's reply; /reload can take a while (ms) */
  commandTimeout?: number;
}

export function encodePacket(id: number, type: number, body: string): Buffer {
  const text = Buffer.from(body, 'utf8');
  const packet = Buffer.alloc(4 + 4 + 4 + text.length + 2);
  packet.writeInt32LE(packet.length - 4, 0);
  packet.writeInt32LE(id, 4);
  packet.writeInt32LE(type, 8);
  text.copy(packet, 12);
  // The last two bytes are already 0 (Buffer.alloc fills with zeros)
  return packet;
}

interface Packet {
  id: number;
  type: number;
  body: string;
}

// Splits incoming bytes into packets. TCP can deliver half a packet or
// several at once, so leftover bytes are kept for the next chunk.
export function createDecoder(onPacket: (packet: Packet) => void) {
  let pending = Buffer.alloc(0);
  return (chunk: Buffer) => {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= 4) {
      const length = pending.readInt32LE(0);
      // Smallest valid packet: id + type + two 0 bytes
      if (length < 10 || length > MAX_REPLY_FRAGMENT + 64) {
        throw new Error('RCON: malformed packet from server');
      }
      if (pending.length < 4 + length) return;
      const id = pending.readInt32LE(4);
      const type = pending.readInt32LE(8);
      const body = pending.subarray(12, 4 + length - 2).toString('utf8');
      pending = pending.subarray(4 + length);
      onPacket({ id, type, body });
    }
  };
}

// Connects, logs in, runs one command and returns the server's reply.
export function rconCommand({
  host,
  port,
  password,
  command,
  connectTimeout = 5000,
  commandTimeout = 30000,
}: RconOptions): Promise<string> {
  if (Buffer.byteLength(command, 'utf8') > MAX_COMMAND_BYTES) {
    return Promise.reject(new Error('RCON: command is too long'));
  }
  if (/[\0\r\n]/.test(command) || /\0/.test(password)) {
    return Promise.reject(new Error('RCON: command or password contains invalid characters'));
  }

  const AUTH_ID = 1;
  const COMMAND_ID = 2;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let stage: 'connecting' | 'auth' | 'command' = 'connecting';
    let reply = '';
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (err: Error | null, value?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(settleTimer);
      socket.destroy();
      if (err) reject(err);
      else resolve(value ?? '');
    };

    const startTimer = (ms: number, what: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => finish(new Error(`RCON: timed out ${what}`)), ms);
    };

    startTimer(connectTimeout, `connecting to ${host}:${port}`);

    socket.on('connect', () => {
      stage = 'auth';
      socket.write(encodePacket(AUTH_ID, TYPE_AUTH, password));
    });

    const decode = createDecoder((packet) => {
      if (stage === 'auth') {
        // Some servers send an empty reply before the login result; skip it
        if (packet.type === TYPE_RESPONSE && packet.id === AUTH_ID) return;
        if (packet.type !== TYPE_AUTH_RESPONSE) return;
        if (packet.id === -1) return finish(new Error('RCON: wrong password'));
        if (packet.id !== AUTH_ID) return finish(new Error('RCON: unexpected login reply'));
        stage = 'command';
        startTimer(commandTimeout, 'waiting for the server to answer');
        socket.write(encodePacket(COMMAND_ID, TYPE_COMMAND, command));
        return;
      }

      if (stage === 'command' && packet.id === COMMAND_ID && packet.type === TYPE_RESPONSE) {
        reply += packet.body;
        if (reply.length > MAX_REPLY_BYTES) return finish(new Error('RCON: reply too large'));
        clearTimeout(settleTimer);
        // A full-size fragment means more may follow; give it a moment
        if (Buffer.byteLength(packet.body, 'utf8') < MAX_REPLY_FRAGMENT) {
          finish(null, reply);
        } else {
          settleTimer = setTimeout(() => finish(null, reply), 250);
        }
      }
    });

    socket.on('data', (chunk: Buffer) => {
      try {
        decode(chunk);
      } catch (err) {
        finish(err instanceof Error ? err : new Error(String(err)));
      }
    });

    socket.on('error', (err) => finish(new Error(`RCON: ${err.message}`)));
    socket.on('close', () => {
      if (stage === 'command' && reply) finish(null, reply);
      else finish(new Error('RCON: the server closed the connection'));
    });
  });
}

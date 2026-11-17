// Tests the RCON client against a small fake Minecraft RCON server.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as net from 'node:net';
import { rconCommand, encodePacket, createDecoder, MAX_COMMAND_BYTES } from './rcon-protocol.ts';

interface FakeOptions {
  password?: string;
  reply?: (command: string) => string[]; // one string per reply packet
  silent?: boolean; // never answer the command
}

// Behaves like Minecraft: id -1 on a wrong password, replies split into packets
function fakeServer({ password = 'secret', reply = (c) => [`ran ${c}`], silent = false }: FakeOptions = {}) {
  const received: string[] = [];
  const server = net.createServer((socket) => {
    const decode = createDecoder((p) => {
      if (p.type === 3) {
        socket.write(encodePacket(p.body === password ? p.id : -1, 2, ''));
      } else if (p.type === 2) {
        received.push(p.body);
        if (!silent) for (const part of reply(p.body)) socket.write(encodePacket(p.id, 0, part));
      }
    });
    socket.on('data', decode);
  });
  return new Promise<{ port: number; received: string[]; close: () => void }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      resolve({ port, received, close: () => server.close() });
    });
  });
}

const base = { host: '127.0.0.1', password: 'secret' };

test('logs in, runs the command and returns the reply', async () => {
  const srv = await fakeServer();
  try {
    assert.equal(await rconCommand({ ...base, port: srv.port, command: 'reload confirm' }), 'ran reload confirm');
    assert.deepEqual(srv.received, ['reload confirm']);
  } finally {
    srv.close();
  }
});

test('joins a reply split over several packets', async () => {
  const long = 'x'.repeat(4096);
  const srv = await fakeServer({ reply: () => [long, long, 'end'] });
  try {
    const out = await rconCommand({ ...base, port: srv.port, command: 'plugins' });
    assert.equal(out, long + long + 'end');
  } finally {
    srv.close();
  }
});

test('a wrong password is reported and no command is sent', async () => {
  const srv = await fakeServer();
  try {
    await assert.rejects(rconCommand({ ...base, password: 'nope', port: srv.port, command: 'reload confirm' }), /wrong password/);
    assert.deepEqual(srv.received, []);
  } finally {
    srv.close();
  }
});

test('times out if the server never answers', async () => {
  const srv = await fakeServer({ silent: true });
  try {
    await assert.rejects(rconCommand({ ...base, port: srv.port, command: 'reload confirm', commandTimeout: 200 }), /timed out/);
  } finally {
    srv.close();
  }
});

test('reports a server that is not running', async () => {
  const srv = await fakeServer();
  srv.close();
  await assert.rejects(rconCommand({ ...base, port: srv.port, command: 'list', connectTimeout: 1000 }), /RCON:/);
});

test('refuses commands that are too long or contain line breaks', async () => {
  await assert.rejects(rconCommand({ ...base, port: 1, command: 'a'.repeat(MAX_COMMAND_BYTES + 1) }), /too long/);
  await assert.rejects(rconCommand({ ...base, port: 1, command: 'say hi\nop someone' }), /invalid characters/);
});

test('packets have the RCON layout', () => {
  const p = encodePacket(7, 2, 'list');
  assert.equal(p.readInt32LE(0), p.length - 4);
  assert.equal(p.readInt32LE(4), 7);
  assert.equal(p.readInt32LE(8), 2);
  assert.equal(p.subarray(12).toString('latin1'), 'list\0\0');
});

test('the decoder handles packets cut in pieces and bad lengths', () => {
  const got: string[] = [];
  const decode = createDecoder((p) => got.push(p.body));
  const both = Buffer.concat([encodePacket(1, 0, 'one'), encodePacket(2, 0, 'two')]);
  for (const byte of both) decode(Buffer.from([byte])); // one byte at a time
  assert.deepEqual(got, ['one', 'two']);
  const bad = Buffer.alloc(16);
  bad.writeInt32LE(2 ** 30, 0);
  assert.throws(() => createDecoder(() => {})(bad), /malformed/);
});

#!/usr/bin/env node
// Download a cliphou.se template source package, check its SHA-256, and extract it into .cliphouse/<id>/.
// Node 18+, no dependencies. It never runs package scripts, installs dependencies, or executes commands from the spec.
// Usage: node fetch.mjs <template-id> [--dir <project-dir>]
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, normalize, resolve, sep} from 'node:path';
import {gunzipSync} from 'node:zlib';

const ORIGIN = (process.env.CLIPHOUSE_ORIGIN || 'https://cliphou.se').replace(/\/$/, '');
const ID = /^[a-z0-9-]{1,100}$/;
const die = (message) => { console.error(`cliphouse-render: ${message}`); process.exit(1); };

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const project = resolve(dirIndex >= 0 ? args[dirIndex + 1] : '.');
const id = args.find((a, i) => dirIndex < 0 || (i !== dirIndex && i !== dirIndex + 1));
if (!ID.test(id ?? '')) die('usage: fetch.mjs <template-id> [--dir <project-dir>]');

const spec = await fetch(`${ORIGIN}/templates/${id}/agent.json`, {signal: AbortSignal.timeout(15_000)}).then((r) => r.ok ? r.json() : die(`unknown template ${id} (HTTP ${r.status})`));
const pkg = spec.source?.package;
const expected = spec.source?.packageSha256;
// Packages must come from the cliphou.se source path, and must have a published checksum.
if (typeof pkg !== 'string' || !pkg.startsWith(`${ORIGIN}/source/`) || !pkg.endsWith('.tar.gz')) die(`unexpected package URL: ${pkg}`);
if (!/^[0-9a-f]{64}$/.test(expected ?? '')) die('the spec has no packageSha256, so the package cannot be checked');

const res = await fetch(pkg, {signal: AbortSignal.timeout(60_000)});
if (!res.ok) die(`${pkg}: HTTP ${res.status}`);
const archive = Buffer.from(await res.arrayBuffer());
const actual = createHash('sha256').update(archive).digest('hex');
if (actual !== expected) die(`checksum mismatch for ${pkg}: expected ${expected}, got ${actual}. Nothing was extracted.`);

// Minimal tar reader: regular files and directories only. Links and absolute or parent paths are rejected.
const tar = gunzipSync(archive);
const out = join(project, '.cliphouse', id);
if (existsSync(out)) rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
const files = [];
for (let off = 0; off + 512 <= tar.length;) {
  const header = tar.subarray(off, off + 512);
  if (header.every((b) => b === 0)) break;
  const str = (start, len) => header.subarray(start, start + len).toString('utf8').replace(/\0.*$/s, '');
  const name = [str(345, 155), str(0, 100)].filter(Boolean).join('/');
  const size = parseInt(str(124, 12).trim() || '0', 8);
  const type = str(156, 1) || '0';
  off += 512;
  const body = tar.subarray(off, off + size);
  off += Math.ceil(size / 512) * 512;
  if (type === 'x' || type === 'g') continue; // pax metadata
  // Drop the package's top-level folder, so files land directly in .cliphouse/<id>/.
  const rel = normalize(name.split('/').slice(1).join('/'));
  if (!rel || rel === '.') continue;
  if (rel.startsWith('..') || rel.startsWith(sep) || /^[a-zA-Z]:/.test(rel)) die(`unsafe path in package: ${name}`);
  const target = join(out, rel);
  if (!target.startsWith(out + sep)) die(`unsafe path in package: ${name}`);
  if (type === '5') { mkdirSync(target, {recursive: true}); continue; }
  if (type !== '0') die(`unsupported entry type ${type} in package: ${name}`);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, body);
  files.push(rel);
}

const engine = spec.engine === 'hyperframes' ? 'hyperframes' : 'remotion';
const music = files.includes(join('music', 'render.mjs'));
console.log(JSON.stringify({id, template: spec.template, engine, music, dir: out, files: files.length, sha256: actual,
  propsFile: engine === 'remotion' ? join(out, 'props.json') : join(out, 'variables.json')}, null, 2));

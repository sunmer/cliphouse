#!/usr/bin/env node
// cliphou.se helper for coding agents. Node 18+, no dependencies.
// Commands: search, spec, preview, link, pick, picker. Set CLIPHOUSE_ORIGIN to test against another host.
import {writeFileSync, mkdtempSync, readFileSync, mkdirSync, existsSync} from 'node:fs';
import {tmpdir, homedir} from 'node:os';
import {join} from 'node:path';

const ORIGIN = (process.env.CLIPHOUSE_ORIGIN || 'https://cliphou.se').replace(/\/$/, '');
const ASPECTS = ['16:9', '9:16', '4:5', '1:1'];
const ID = /^[a-z0-9-]{1,100}$/;

// Query words that should also match catalog vocabulary.
const SYNONYMS = {
  launch: ['launch', 'release', 'feature', 'drop', 'product'], release: ['launch', 'release'], ship: ['launch', 'release'],
  product: ['product', 'launch', 'saas', 'app'], app: ['app', 'mobile', 'saas', 'product'], saas: ['saas', 'product', 'app'],
  promo: ['promo', 'ad', 'social'], ad: ['ad', 'promo', 'social'], intro: ['intro', 'reveal', 'title', 'opener'],
  logo: ['logo', 'reveal', 'brand'], brand: ['brand', 'logo', 'intro'], announce: ['announcement', 'news'],
  stats: ['stat', 'data', 'chart', 'counter', 'recap'], data: ['data', 'chart', 'stat'], music: ['music', 'beat', 'score'],
  event: ['event', 'webinar', 'speaker', 'agenda'], sale: ['sale', 'discount', 'offer'], hiring: ['hiring', 'jobs'],
};
const STOP = new Set('a an the for of to and or with my our this that need want make video videos clip some me i we it is in on'.split(' '));

const die = (message) => { console.error(`cliphouse: ${message}`); process.exit(1); };
const words = (s) => String(s).toLowerCase().split(/[^a-z0-9:]+/).filter((w) => w && !STOP.has(w));
const stem = (w) => w.replace(/(ing|es|s)$/, '');

async function get(path, type = 'json') {
  const res = await fetch(`${ORIGIN}${path}`, {signal: AbortSignal.timeout(15_000)});
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

// Cache preview files locally. Chat apps render local media reliably; remote URLs may be blocked.
const ROOT = process.env.CLIPHOUSE_CACHE || join(homedir(), '.cache', 'cliphouse');
const CACHE = join(ROOT, 'previews');
// The last searchId, so spec, preview, and link calls can be tied to the search that found the template.
const LAST = join(ROOT, 'last-search.json');
const remember = (searchId) => { try { mkdirSync(ROOT, {recursive: true}); writeFileSync(LAST, JSON.stringify({searchId, at: Date.now()})); } catch {} };
const lastSearch = () => {
  try {
    const {searchId, at} = JSON.parse(readFileSync(LAST, 'utf8'));
    return Date.now() - at < 6 * 3600_000 && /^[A-Za-z0-9_-]{8,40}$/.test(searchId) ? searchId : undefined;
  } catch { return undefined; }
};
// Only preview files from <origin>/previews/ are cached, and only for checked template ids.
async function cached(id, ext) {
  if (!ID.test(id) || !['mp4', 'jpg'].includes(ext)) throw new Error(`invalid preview ${id}.${ext}`);
  const file = join(CACHE, `${id}.${ext}`);
  if (existsSync(file)) return file;
  mkdirSync(CACHE, {recursive: true});
  const res = await fetch(`${ORIGIN}/previews/${id}.${ext}`, {signal: AbortSignal.timeout(30_000)});
  if (!res.ok) throw new Error(`preview ${id}.${ext}: HTTP ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const label = (r) => [r.aspect, r.seconds && `${r.seconds}s`, r.engine, r.music && 'music'].filter(Boolean).join(' · ');

async function inline(results) {
  for (const r of results) {
    [r.localPreview, r.localPoster] = await Promise.all([cached(r.id, 'mp4'), cached(r.id, 'jpg')]).catch(() => [null, null]);
  }
  // Two-column table: a title row, then a video row, for each pair.
  const cell = (r, i) => (r ? `**${i + 1}. ${r.title.replace(/\|/g, '-')}**` : ' ');
  const media = (r) => (r ? (r.localPreview ? `![${r.title.replace(/[\]|]/g, '')}](${r.localPreview})` : `[Preview](${r.preview})`) : ' ');
  const rows = [];
  for (let i = 0; i < results.length; i += 2) {
    const [a, b] = [results[i], results[i + 1]];
    rows.push(`| ${cell(a, i)} | ${cell(b, i + 1)} |`, ...(i === 0 ? ['| --- | --- |'] : []), `| ${media(a)} | ${media(b)} |`);
  }
  return rows.join('\n');
}

// Self-contained in-chat picker. Media is inlined as data URLs because the chat sandbox blocks other origins.
async function picker(args) {
  const outIndex = args.indexOf('--out');
  const out = outIndex >= 0 ? args[outIndex + 1] : null;
  const ids = args.filter((a, i) => outIndex < 0 || (i !== outIndex && i !== outIndex + 1));
  if (!out || !ids.length || ids.length > 6 || ids.some((id) => !ID.test(id))) die('usage: picker <id> [id...] --out <file.html> (max 6)');
  const specs = await Promise.all(ids.map((id) => get(`/templates/${id}/agent.json`).catch(() => null)));
  const tiles = [];
  for (const [i, id] of ids.entries()) {
    const [mp4, jpg] = await Promise.all([cached(id, 'mp4'), cached(id, 'jpg')]);
    const data = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
    const title = specs[i]?.title ?? id;
    tiles.push(`  <button type="button" class="ch-tile cursor-interaction" data-id="${esc(id)}" data-title="${esc(title)}" aria-pressed="false" aria-label="Select ${esc(title)}">
    <span class="ch-title"><span class="ch-num">${i + 1}</span>${esc(title)}</span>
    <span class="ch-media"><video src="${data(mp4, 'video/mp4')}" poster="${data(jpg, 'image/jpeg')}" muted loop autoplay playsinline preload="auto"></video></span>
  </button>`);
  }
  const html = `<div id="cliphouse-picker">
<style>
#cliphouse-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 16px;padding:4px 0}
@media (max-width:480px){#cliphouse-picker{grid-template-columns:1fr}}
#cliphouse-picker .ch-tile{all:unset;display:flex;flex-direction:column;gap:10px;min-width:0;border-radius:8px}
#cliphouse-picker .ch-tile:focus-visible{outline:2px solid #3ec9b0;outline-offset:4px}
#cliphouse-picker .ch-media{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:16/10;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 0 0 1px rgba(127,127,127,.25)}
#cliphouse-picker .ch-media video{width:100%;height:100%;object-fit:contain;pointer-events:none}
#cliphouse-picker .ch-tile:hover .ch-media{box-shadow:0 0 0 2px rgba(127,127,127,.6)}
#cliphouse-picker .ch-tile[aria-pressed="true"] .ch-media{box-shadow:0 0 0 3px #3ec9b0}
#cliphouse-picker .ch-title{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;line-height:1.3;overflow-wrap:anywhere}
#cliphouse-picker .ch-num{flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#ff5a36;color:#111;font-size:12px;font-weight:700}
</style>
${tiles.join('\n')}
<p class="sr-only" aria-live="polite" id="cliphouse-picker-status"></p>
</div>
<script>
(() => {
  const root = document.getElementById('cliphouse-picker');
  const status = document.getElementById('cliphouse-picker-status');
  const tiles = [...root.querySelectorAll('.ch-tile')];
  const mark = (id) => tiles.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.id === id)));
  const saved = window.openai?.widgetState?.privateContent?.selected;
  if (saved) mark(saved);
  tiles.forEach((tile) => tile.addEventListener('click', async () => {
    const {id, title} = tile.dataset;
    mark(id);
    status.textContent = 'Selected ' + title;
    window.openai?.setWidgetState?.({modelContent: {selected: id}, privateContent: {selected: id}})?.catch?.(() => {});
    // Runs only on the user's click, and sends only this fixed message with a checked id.
    if (!/^[a-z0-9-]+$/.test(id)) return;
    try { await window.openai?.sendFollowUpMessage?.({prompt: '$cliphouse: use template ' + id + ' and fill it for this project'}); } catch {}
  }));
  tiles.forEach((t) => t.querySelector('video').play?.().catch(() => {}));
})();
</script>
`;
  writeFileSync(out, html);
  console.log(JSON.stringify({file: out, bytes: Buffer.byteLength(html), reference: `visualize{"path":"${out}"}`}));
}

// Prefer the structured catalog. Older deploys only have llms.txt, so parse that instead.
async function catalog() {
  try {
    const data = await get('/catalog.json');
    if (Array.isArray(data.templates)) return data.templates;
  } catch {}
  const text = await get('/llms.txt', 'text');
  const section = text.split('## Templates')[1]?.split('\n## ')[0] ?? '';
  return [...section.matchAll(/^- \[(.+?)\]\((https?:\/\/[^)]+\/templates\/([a-z0-9-]+)\/)\): (.+)$/gm)].map(([, title, page, id, description]) => ({
    id, title, description, page, aspect: ASPECTS.find((a) => description.includes(a)) ?? null,
  }));
}

function score(item, terms) {
  const fields = [[item.title, 3], [[item.purpose, ...(item.useCases ?? [])].join(' '), 3], [(item.style ?? []).join(' '), 1], [item.description, 1]];
  let total = 0;
  for (const group of terms) {
    let best = 0;
    for (const [field, weight] of fields) {
      const tokens = words(field ?? '').map(stem);
      if (group.some((t) => tokens.some((tok) => tok === t || (t.length > 3 && tok.startsWith(t))))) best = Math.max(best, weight);
    }
    total += best;
  }
  return total;
}

const summarize = (item, spec) => ({
  id: item.id, title: item.title, description: item.description,
  aspect: spec?.format?.aspectRatio ?? item.aspect ?? null, seconds: spec?.format?.seconds ?? item.seconds ?? null,
  engine: spec?.engine ?? item.engine ?? null, music: Boolean(spec?.music ?? item.music), creator: item.creator ?? null,
  poster: `${ORIGIN}/previews/${item.id}.jpg`, preview: `${ORIGIN}/previews/${item.id}.mp4`,
  page: `${ORIGIN}/templates/${item.id}/`, editor: `${ORIGIN}/#/v/${item.id}`,
});

// One MCP tool call over plain HTTPS (stateless Streamable HTTP, JSON responses).
async function mcp(name, args, timeout = 15_000) {
  const res = await fetch(`${ORIGIN}/mcp`, {
    method: 'POST', signal: AbortSignal.timeout(timeout),
    headers: {'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'User-Agent': 'cliphouse-skill/1.2'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: {name, arguments: args}}),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) throw Object.assign(new Error(body?.error?.message ?? `HTTP ${res.status}`), {status: res.status});
  const content = body.result.content ?? [];
  return {text: content[0]?.text ?? '', isError: Boolean(body.result.isError), image: content.find((c) => c.type === 'image')};
}

async function search(args) {
  const opts = {limit: 6, aspect: null, maxSeconds: null, query: []};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--aspect') opts.aspect = args[++i];
    else if (args[i] === '--max-seconds') opts.maxSeconds = Number(args[++i]);
    else if (args[i] === '--limit') opts.limit = Math.min(Math.max(Number(args[++i]) || 6, 1), 20);
    else if (args[i] === '--inline') opts.inline = true;
    else opts.query.push(args[i]);
  }
  if (opts.aspect && !ASPECTS.includes(opts.aspect)) die(`--aspect must be one of ${ASPECTS.join(', ')}`);
  const query = opts.query.join(' ');
  // Server search first, so the skill and the MCP server rank the same way.
  try {
    const {text, isError} = await mcp('search_templates', {query: query || undefined, aspect: opts.aspect ?? undefined,
      maxSeconds: opts.maxSeconds || undefined, limit: opts.limit});
    if (!isError) {
      const found = JSON.parse(text);
      if (found.searchId) remember(found.searchId);
      const results = (Array.isArray(found) ? found : found.results ?? []).map((r) => ({...summarize(r, null), ...r,
        poster: r.poster ?? `${ORIGIN}/previews/${r.id}.jpg`, preview: r.preview ?? `${ORIGIN}/previews/${r.id}.mp4`}));
      const markdown = opts.inline ? await inline(results) : undefined;
      console.log(JSON.stringify({query, filters: {aspect: opts.aspect, maxSeconds: opts.maxSeconds}, source: 'server', searchId: found.searchId, results, markdown}, null, 2));
      return;
    }
  } catch {}
  const terms = words(query).filter((w) => !ASPECTS.includes(w)).map((w) => (SYNONYMS[w] ?? SYNONYMS[stem(w)] ?? [w]).map(stem));
  const items = await catalog();
  const ranked = items.map((item) => ({item, s: terms.length ? score(item, terms) : 1})).filter((r) => r.s > 0)
    .filter((r) => !opts.aspect || !r.item.aspect || r.item.aspect === opts.aspect)
    .sort((a, b) => b.s - a.s).slice(0, opts.limit * 3);
  // Specs give the exact format and length, so fetch them for the shortlist only.
  const specs = await Promise.all(ranked.map(({item}) => get(`/templates/${item.id}/agent.json`).catch(() => null)));
  const results = ranked.map(({item, s}, i) => ({...summarize(item, specs[i]), score: s}))
    .filter((r) => !opts.aspect || r.aspect === opts.aspect)
    .filter((r) => !opts.maxSeconds || !r.seconds || r.seconds <= opts.maxSeconds)
    .slice(0, opts.limit);
  const markdown = opts.inline ? await inline(results) : undefined;
  console.log(JSON.stringify({query, filters: {aspect: opts.aspect, maxSeconds: opts.maxSeconds}, source: 'local', catalogSize: items.length, results, markdown}, null, 2));
}

async function spec([id]) {
  if (!ID.test(id ?? '')) die('usage: spec <template-id>');
  // The MCP tool returns the same spec and records the pick. The static file is the fallback.
  const r = await mcp('get_template_spec', {variantId: id, searchId: lastSearch()}).catch(() => null);
  if (r?.isError) die(r.text);
  const s = r ? JSON.parse(r.text) : await get(`/templates/${id}/agent.json`);
  // Print the parts an agent edits. Source package and render steps are left out on purpose:
  // local rendering lives in the separate cliphouse-render skill. The full spec stays at fullSpec.
  const instructions = (s.instructions ?? []).filter((line) => !/source\.(package|renderCommand)|render the source|download/i.test(line));
  console.log(JSON.stringify({
    id: s.id, title: s.title, engine: s.engine, format: s.format, templateVersion: s.templateVersion,
    editableFields: s.editableFields, props: s.props, music: s.music ?? null,
    handoff: s.handoff?.urlTemplate, credit: s.credit, instructions, fullSpec: `${ORIGIN}/templates/${id}/agent.json`,
  }, null, 2));
}

// Validate props on the server (the same check the editor uses) and print the editor link.
async function link([id, file]) {
  if (!ID.test(id ?? '') || !file) die('usage: link <template-id> <props.json | ->');
  const props = JSON.parse(file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8'));
  const {text, isError} = await mcp('build_edit_link', {variantId: id, props, searchId: lastSearch()}).catch((e) => die(e.message));
  if (isError) die(`props rejected: ${text}`);
  console.log(JSON.parse(text).url);
}

// Render the filled template on the server and save the poster locally, so the chat can show it inline.
async function preview(args) {
  const outIndex = args.indexOf('--out');
  const out = outIndex >= 0 ? args[outIndex + 1] : null;
  const [id, file] = args.filter((a, i) => outIndex < 0 || (i !== outIndex && i !== outIndex + 1));
  if (!ID.test(id ?? '') || !file) die('usage: preview <template-id> <props.json | -> [--out <file.html>]');
  const props = JSON.parse(file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8'));
  const started = Date.now();
  let result;
  try { result = await mcp('render_preview', {variantId: id, props, searchId: lastSearch()}, 40_000); }
  catch (e) {
    if (e.status === 429 || /abort|timed out/i.test(e.message)) {
      // The editor link still shows the filled video, so the flow continues without a poster.
      const fallback = await mcp('build_edit_link', {variantId: id, props, searchId: lastSearch()}).catch(() => null);
      if (!fallback || fallback.isError) die(e.message);
      console.log(JSON.stringify({poster: null, local: null, editor: JSON.parse(fallback.text).url, message: 'The preview is not available. Open the editor link to see the video.'}, null, 2));
      return;
    }
    die(e.message);
  }
  if (result.isError) die(`props rejected: ${result.text}`);
  const data = JSON.parse(result.text);
  let local = null;
  if (data.poster) {
    const name = data.poster.split('/').pop();
    local = join(CACHE, `custom-${name}`);
    mkdirSync(CACHE, {recursive: true});
    if (result.image?.data) writeFileSync(local, Buffer.from(result.image.data, 'base64'));
    else {
      const res = await fetch(data.poster, {signal: AbortSignal.timeout(20_000)}).catch(() => null);
      if (res?.ok) writeFileSync(local, Buffer.from(await res.arrayBuffer())); else local = null;
    }
  }
  const title = (await get(`/templates/${id}/agent.json`).catch(() => null))?.title ?? id;
  const markdown = local ? `![${title.replace(/[\]|]/g, '')}](${local})` : undefined;
  let reference;
  if (out && local) {
    const src = `data:image/jpeg;base64,${readFileSync(local).toString('base64')}`;
    writeFileSync(out, `<div id="cliphouse-preview">
<style>
#cliphouse-preview{display:flex;flex-direction:column;gap:12px;max-width:640px}
#cliphouse-preview img{width:100%;height:auto;border-radius:8px;box-shadow:0 0 0 3px #3ec9b0;background:#000}
#cliphouse-preview .ch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#cliphouse-preview .ch-title{font-weight:600;font-size:14px}
#cliphouse-preview a{font:600 14px/1 system-ui,sans-serif;color:#0d1a17;background:#3ec9b0;border-radius:6px;padding:9px 12px;text-decoration:none}
</style>
<img src="${src}" alt="${esc(title)} with your product">
<div class="ch-row"><span class="ch-title">${esc(title)}</span><a href="${esc(data.editor)}" target="_blank" rel="noopener">Open in editor</a></div>
</div>
`);
    reference = `visualize{"path":"${out}"}`;
  }
  console.log(JSON.stringify({poster: data.poster, local, editor: data.editor, video: data.video ?? null, markdown, reference,
    message: data.message, seconds: Math.round((Date.now() - started) / 100) / 10}, null, 2));
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Write a local page that plays the previews side by side. It prints the path; the agent asks before opening it.
async function pick(args) {
  const ids = args.filter((a) => a !== '--no-open');
  if (!ids.length || ids.some((id) => !ID.test(id))) die('usage: pick <id> [id...]');
  const specs = await Promise.all(ids.map((id) => get(`/templates/${id}/agent.json`).catch(() => null)));
  const cards = ids.map((id, i) => {
    const s = specs[i];
    const r = summarize({id, title: s?.title ?? id}, s);
    return `<article><div class="media"><video src="${esc(r.preview)}" poster="${esc(r.poster)}" muted loop autoplay playsinline controls></video></div>
<div class="meta"><span class="num">${i + 1}</span><div><h2>${esc(r.title)}</h2><p>${esc([r.aspect, r.seconds && `${r.seconds}s`, r.engine, r.music && 'music'].filter(Boolean).join(' · '))}</p></div></div>
<div class="actions"><button data-copy="$cliphouse: use template ${esc(id)} and fill it for this project">Copy pick</button><a href="${esc(r.page)}" target="_blank" rel="noopener">Page</a><a href="${esc(r.editor)}" target="_blank" rel="noopener">Editor</a></div></article>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>cliphou.se picks</title>
<style>body{margin:0;font:14px/1.4 system-ui,sans-serif;background:#111317;color:#eceae4}header{padding:16px 24px;border-bottom:1px solid #262a31;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}
header b{font-size:16px}header span{color:#9aa0aa}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));align-items:start;gap:16px;padding:24px}
article{background:#1a1d23;border:1px solid #262a31;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}.media{background:#000;display:flex;align-items:center;justify-content:center;height:300px}
video{width:100%;height:100%;object-fit:contain}.meta{display:flex;gap:10px;padding:12px 14px 4px}.num{flex:none;width:26px;height:26px;border-radius:6px;background:#ff5a36;color:#111;font-weight:700;display:grid;place-items:center}
h2{font-size:15px;margin:0}p{margin:2px 0 0;color:#9aa0aa}.actions{display:flex;gap:8px;padding:10px 14px 14px;margin-top:auto}
button,a{font:inherit;color:#eceae4;background:#262a31;border:1px solid #333944;border-radius:6px;padding:6px 10px;text-decoration:none;cursor:pointer}button{background:#3ec9b0;color:#0d1a17;border-color:#3ec9b0;font-weight:600}</style></head>
<body><header><b>cliphou.se</b><span>Reply with a number in your agent, or copy a pick.</span></header><main>${cards}</main>
<script>document.addEventListener('click',async(e)=>{const b=e.target.closest('[data-copy]');if(!b)return;await navigator.clipboard.writeText(b.dataset.copy);const t=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=t,1200)})</script></body></html>`;
  const file = join(mkdtempSync(join(tmpdir(), 'cliphouse-')), 'picks.html');
  writeFileSync(file, html);
  console.log(file);
}

const [command, ...rest] = process.argv.slice(2);
const commands = {search, spec, preview, link, pick, picker};
if (!commands[command]) die('usage: cliphouse.mjs <search|spec|preview|link|pick|picker> ...');
commands[command](rest).catch((e) => die(/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|abort/i.test(`${e.message} ${e.cause?.code ?? ''}`) ? `cannot reach ${ORIGIN}. Check the network and try again.` : e.message));

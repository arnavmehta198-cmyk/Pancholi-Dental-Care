import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const distDir = resolve('dist');
const assetsDir = join(distDir, 'assets');
if (!existsSync(assetsDir)) {
  console.error('Bundle verification failed: run npm run build first.');
  process.exit(1);
}

const read = name => readFileSync(join(assetsDir, name), 'utf8');
const assets = readdirSync(assetsDir);
const html = readFileSync(join(distDir, 'index.html'), 'utf8');
const initialScripts = [...html.matchAll(/<script[^>]+src="\/assets\/([^"?]+\.js)"/g)].map(match => match[1]);
const modulePreloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/assets\/([^"?]+\.js)"/g)].map(
  match => match[1],
);

if (initialScripts.length !== 1) {
  console.error(`Bundle verification failed: expected one initial script, found ${initialScripts.length}.`);
  process.exit(1);
}

const initialFiles = [...new Set([...initialScripts, ...modulePreloads])];
const missingInitialFiles = initialFiles.filter(name => !assets.includes(name));
if (missingInitialFiles.length) {
  console.error(`Bundle verification failed: missing initial assets: ${missingInitialFiles.join(', ')}.`);
  process.exit(1);
}

const initialSource = initialFiles.map(read).join('\n');
const initialSize = statSync(join(assetsDir, initialScripts[0])).size;

const runtimeMarkers = [
  'autoSleep',
  'ScrollTrigger',
  'CSSPlugin',
  'useMotionValue',
  'useAnimationFrame',
  'new Renderer',
  'new Lenis',
];
const leakedMarkers = runtimeMarkers.filter(marker => initialSource.includes(marker));

const asyncChunkChecks = [
  { label: 'AnimatedProfileStack', pattern: /^AnimatedProfileStack-[^/]+\.js$/ },
  { label: 'Prism', pattern: /^Prism-[^/]+\.js$/ },
];
const missingAsyncChunks = asyncChunkChecks
  .filter(({ pattern }) => !assets.some(name => pattern.test(name)))
  .map(({ label }) => label);

const asyncSources = assets
  .filter(name => name.endsWith('.js') && !initialFiles.includes(name))
  .map(name => ({ name, source: read(name) }));
const libraryChecks = [
  { label: 'Lenis', file: /^AnimatedProfileStack-[^/]+\.js$/, marker: /\bLenis\b|virtualScroll/ },
  { label: 'OGL/WebGL', file: /^Prism-[^/]+\.js$/, marker: /\bRenderer\b|\bWebgl\b|\bProgram\b/ },
];
const missingLibraries = libraryChecks
  .filter(({ file, marker }) => {
    const chunk = asyncSources.find(({ name }) => file.test(name));
    return !chunk || (marker && !marker.test(chunk.source));
  })
  .map(({ label }) => label);

console.log(`Initial JS: ${initialScripts[0]} (${initialSize} bytes)`);
console.log(`Initial HTML JS: ${initialFiles.join(', ') || 'none'}`);
console.log(`Initial runtime markers: ${leakedMarkers.length ? leakedMarkers.join(', ') : 'none'}`);
console.log(`Async animation chunks: ${asyncChunkChecks.map(({ label }) => label).join(', ')}`);

if (leakedMarkers.length || missingAsyncChunks.length || missingLibraries.length) {
  if (missingAsyncChunks.length) console.error(`Missing async animation chunks: ${missingAsyncChunks.join(', ')}.`);
  if (missingLibraries.length) console.error(`Missing async animation libraries: ${missingLibraries.join(', ')}.`);
  process.exit(1);
}

console.log('Bundle verification passed.');

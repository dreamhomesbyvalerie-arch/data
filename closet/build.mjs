// Builds two copies of Valet from src/:
//   index.html     stand-alone installable web app (offline, live weather, data in this browser)
//   artifact.html  the same app as a Claude artifact page (Google Calendar, Gmail, Claude, synced storage)
// Run: node closet/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(dir, 'src', f), 'utf8');
const order = ['data.js', 'util.js', 'store.js', 'icons.js', 'engine.js', 'importers.js', 'platform.js', 'ui-core.js', 'ui-views.js', 'ui-sheets.js', 'interview.js', 'app.js'];
const js = `(() => {\n'use strict';\n${order.map((f) => `/* ===== ${f} ===== */\n${src(f)}`).join('\n')}\n})();`;
const css = src('styles.css');
const fonts = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

const body = `<div id="app"></div>\n<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;

// Artifact page: content only; the publisher wraps it in its own skeleton.
const artifact = `<title>Valet Wardrobe</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
${css}
</style>
${body}
`;
writeFileSync(join(dir, 'artifact.html'), artifact);

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Valet Wardrobe</title>
<meta name="description" content="Plan outfits from your own closet around the weather, your calendar and your style.">
<meta name="theme-color" content="#f2f3f6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111215" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Valet">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); color-scheme: light; }
[hidden] { display: none !important; }
img { max-width: 100%; }
${css}
</style>
</head>
<body>
${body}
<script>if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});</script>
</body>
</html>
`;
writeFileSync(join(dir, 'index.html'), standalone);
console.log(`built index.html (${(standalone.length / 1024).toFixed(0)} KB) and artifact.html (${(artifact.length / 1024).toFixed(0)} KB)`);

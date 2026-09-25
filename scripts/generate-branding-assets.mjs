import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandingDir = join(root, 'assets', 'branding');
const imagesDir = join(root, 'assets', 'images');

const exports = [
  { input: 'app-icon.svg', output: 'icon.png', width: 1024, height: 1024 },
  { input: 'splash-icon.svg', output: 'splash-icon.png', width: 512, height: 512 },
  { input: 'android-foreground.svg', output: 'android-icon-foreground.png', width: 1024, height: 1024 },
  { input: 'android-background.svg', output: 'android-icon-background.png', width: 1024, height: 1024 },
  { input: 'android-monochrome.svg', output: 'android-icon-monochrome.png', width: 1024, height: 1024 },
  { input: 'splash-icon.svg', output: 'favicon.png', width: 48, height: 48 },
];

async function renderSvgToPng(inputName, outputName, width, height) {
  const svg = readFileSync(join(brandingDir, inputName));
  const outPath = join(imagesDir, outputName);
  await sharp(svg, { density: 300 }).resize(width, height).png().toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

for (const item of exports) {
  await renderSvgToPng(item.input, item.output, item.width, item.height);
}

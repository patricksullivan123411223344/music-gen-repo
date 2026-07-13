import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const synthPkg = path.join(root, 'node_modules', 'js-synthesizer');
const outDir = path.join(root, 'public', 'synth');

const copies = [
  ['externals/libfluidsynth-2.4.6.js', 'libfluidsynth-2.4.6.js'],
  ['dist/js-synthesizer.worklet.js', 'js-synthesizer.worklet.js'],
];

fs.mkdirSync(outDir, { recursive: true });

for (const [srcRel, destName] of copies) {
  const src = path.join(synthPkg, srcRel);
  const dest = path.join(outDir, destName);
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src} — run npm install in frontend first.`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied ${destName}`);
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tscBin = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');

console.log('Building CommonJS...');
execSync(`"${tscBin}"`, { stdio: 'inherit', env: process.env });

console.log('Building ESM...');
execSync(`"${tscBin}" -p tsconfig.esm.json`, { stdio: 'inherit', env: process.env });

// In dist/esm/index.js, ensure relative imports point to .mjs
const esmIndexPath = path.join(__dirname, '..', 'dist', 'esm', 'index.js');
let esmContent = fs.readFileSync(esmIndexPath, 'utf8');
esmContent = esmContent.replace(/from\s+['"]\.\/constants['"]/g, "from './constants.mjs'");

const outEsmIndex = path.join(__dirname, '..', 'dist', 'index.mjs');
fs.writeFileSync(outEsmIndex, esmContent, 'utf8');

const esmConstantsPath = path.join(__dirname, '..', 'dist', 'esm', 'constants.js');
const outEsmConstants = path.join(__dirname, '..', 'dist', 'constants.mjs');
fs.copyFileSync(esmConstantsPath, outEsmConstants);

// Remove temp dist/esm folder
fs.rmSync(path.join(__dirname, '..', 'dist', 'esm'), { recursive: true, force: true });

// Make CLI executable
const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
if (fs.existsSync(cliPath)) {
    fs.chmodSync(cliPath, 0o755);
}

console.log('Build complete (CJS + ESM + CLI)!');

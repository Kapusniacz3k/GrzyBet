const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const environment = { ...process.env };
const bundledJava = 'C:/Program Files/Android/Android Studio/jbr/bin';
const pathKey = Object.keys(environment).find(key => key.toLowerCase() === 'path') ?? 'PATH';
environment[pathKey] = path.dirname(process.execPath) + path.delimiter + (environment[pathKey] ?? '');
if (process.platform === 'win32' && existsSync(path.join(bundledJava, 'java.exe'))) {
  environment[pathKey] = bundledJava + path.delimiter + environment[pathKey];
}
const cli = path.join(__dirname, '..', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const child = spawn(process.execPath, [
  cli, 'emulators:exec', '--project', 'demo-grzybet', '--only', 'auth,firestore,storage',
  'node --import tsx --test tests/cloud/*.test.mjs',
], { cwd: path.join(__dirname, '..'), env: environment, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
function configuration() {
  const local = path.join(root, '.env.local');
  const env = { ...process.env };
  if (fs.existsSync(local)) {
    for (const line of fs.readFileSync(local, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').trim();
    }
  }
  const project = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const bucket = env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (project !== 'grzybet' || bucket !== 'grzybet.firebasestorage.app' || env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST) {
    throw new Error('Ten skrypt konfiguruje wyłącznie zdjęcia w prawdziwym projekcie grzybet. Sprawdź .env.local.');
  }
  return { project, bucket };
}
function deployRules(project) {
  return new Promise((resolve, reject) => {
    const cli = require.resolve('firebase-tools/lib/bin/firebase');
    const child = spawn(process.execPath, [cli, 'deploy', '--only', 'storage', '--project', project, '--non-interactive'],
      { cwd: root, stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Nie udało się wdrożyć reguł zdjęć. Sprawdź komunikat Firebase powyżej.')));
  });
}
async function main() {
  const { project, bucket } = configuration();
  // Reuse the Firebase CLI's existing login; never write or print its credentials.
  const auth = require('firebase-tools/lib/auth');
  const account = auth.getProjectDefaultAccount(root);
  if (!account) throw new Error('Najpierw zaloguj się: npx.cmd firebase login');
  const options = { project, nonInteractive: true };
  auth.setActiveAccount(options, account);
  await require('firebase-tools/lib/requireAuth').requireAuth(options);
  const { Client } = require('firebase-tools/lib/apiv2');
  const billing = await new Client({ urlPrefix: 'https://cloudbilling.googleapis.com', apiVersion: 'v1' }).get('/projects/' + project + '/billingInfo');
  if (!billing.body.billingEnabled) {
    console.log('Zdjęcia czekają na aktywację planu Blaze przez właściciela projektu. Skrypt nie zmienia rozliczeń.');
    console.log('Otwórz: https://console.firebase.google.com/project/grzybet/storage');
    process.exitCode = 2;
    return;
  }
  const storage = require('firebase-tools/lib/gcp/storage');
  let current;
  try { current = await storage.getBucket(bucket); }
  catch (error) {
    if (error.status !== 404) throw error;
    console.log('W konsoli Firebase otwórz Storage → Rozpocznij i utwórz domyślny bucket w trybie produkcyjnym.');
    console.log('https://console.firebase.google.com/project/grzybet/storage');
    process.exitCode = 2;
    return;
  }
  console.log('Przechowywanie zdjęć jest aktywne: ' + bucket);
  // Firebase CLI skips this prerequisite in non-interactive deployments.
  const metadata = await require('firebase-tools/lib/management/projects').getProject(project);
  if (!/^\d+$/.test(String(metadata.projectNumber))) throw new Error('Nie udało się odczytać numeru projektu Firebase.');
  const serviceAccount = `service-${metadata.projectNumber}@gcp-sa-firebasestorage.iam.gserviceaccount.com`;
  const roles = ['roles/firebaserules.firestoreServiceAgent'];
  const manager = require('firebase-tools/lib/gcp/resourceManager');
  const hasMembershipAccess = await manager.serviceAccountHasRoles(project, serviceAccount, roles, true);
  if (!hasMembershipAccess) {
    if (process.argv.includes('--check')) {
      console.log('Brakuje uprawnienia usługi Storage do sprawdzania uczestników pokoju. Uruchom npm.cmd run firebase:photos.');
      process.exitCode = 2;
      return;
    }
    await manager.addServiceAccountToRoles(project, serviceAccount, roles, true);
    console.log('Usługa zdjęć może sprawdzać uczestników pokoju w Firestore.');
  }
  if (process.argv.includes('--check')) return;
  await deployRules(project);
  const desired = JSON.parse(fs.readFileSync(path.join(root, 'firebase/storage-cors.json'), 'utf8'));
  const existing = current.cors ?? [];
  const cors = [...existing, ...desired.filter(rule => !existing.some(item => JSON.stringify(item) === JSON.stringify(rule)))];
  await storage.patchBucket(bucket, { cors });
  console.log('Gotowe: reguły zdjęć i pobieranie w przeglądarce są skonfigurowane.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

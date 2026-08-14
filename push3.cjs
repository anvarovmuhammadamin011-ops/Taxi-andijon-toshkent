const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const repo = 'C:\\Users\\Victus\\Desktop\\Taxi miniapp';
function run(cmd) {
  try { return { ok: true, out: execSync(cmd, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; }
  catch (e) { return { ok: false, out: String(e.stderr || e.message).trim().split('\n').slice(0, 6).join(' | ') }; }
}
fs.rmSync(path.join(repo, 'taxi-v2/backend/src/tmp_classifier_test.ts'), { force: true });
const lines = [];
lines.push('CHANGED:' + run('git status --porcelain').out.replace(/\n/g, ' ;; '));
lines.push('ADD:' + run('git add -A').out.replace(/\n/g, ' ;; '));
if (run('git diff --cached --quiet').ok) { lines.push('NOTHING_TO_COMMIT'); }
else {
  lines.push('COMMIT:' + run('git commit -m "Classifier: transport-context gate (no more false passenger posts like qiz izlayapman) + route-based passenger boost"').out.replace(/\n/g, ' | '));
}
lines.push('PUSH:' + (run('git push origin main').out.replace(/\n/g, ' ;; ') || '(empty)'));
lines.push('LOCAL:' + run('git rev-parse --short HEAD').out);
lines.push('REMOTE:' + run('git ls-remote origin main').out.split(/\s+/)[0]);
lines.push('CLEAN:' + (run('git status --porcelain').out || 'yes'));
fs.writeFileSync(path.join(repo, 'res3.txt'), lines.join('\n'));
console.log('done');
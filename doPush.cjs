const { execSync } = require('child_process');
const path = require('path');
const repo = 'C:\\Users\\Victus\\Desktop\\Taxi miniapp';
function run(cmd) {
  try { return { ok: true, out: execSync(cmd, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; }
  catch (e) { return { ok: false, out: String(e.stderr || e.message).trim().split('\n').slice(0, 5).join(' | ') }; }
}
const lines = [];
lines.push('CHANGED:' + run('git status --porcelain').out.replace(/\n/g, ' ;; '));
const staged = run('git add -A');
lines.push('ADD:' + staged.out);
if (run('git diff --cached --quiet').ok) { lines.push('NOTHING_TO_COMMIT'); }
else {
  lines.push('COMMIT:' + run('git commit -m "Fix Yolovchi filter: dedicated persistent passenger store (drivers no longer evict them); /api/posts?type=passenger serves it; frontend filter uses it"').out);
}
lines.push('PUSH:' + run('git push origin main').out.replace(/\n/g, ' ;; '));
lines.push('HEAD:' + run('git rev-parse --short HEAD').out);
lines.push('HEADMSG:' + run('git log -1 --format=%s').out);
require('fs').writeFileSync(path.join(repo, 'pushresult.txt'), lines.join('\n'));
console.log('done');
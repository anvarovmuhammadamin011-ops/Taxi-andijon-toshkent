import { classifyMessage } from '../src/services/classifier';
import * as fs from 'fs';
import * as path from 'path';

const file = path.resolve(__dirname, '../data/posts.json');
const posts = JSON.parse(fs.readFileSync(file, 'utf-8')) as any[];
const kept: any[] = [];
let driver = 0;
let unknown = 0;
let updated = 0;

for (const p of posts) {
  const r = classifyMessage(p.originalText || '');
  if (r.type !== 'PASSENGER') {
    if (r.type === 'DRIVER') driver++;
    else unknown++;
    continue;
  }
  if (p.classification !== 'passenger' || p.route !== r.route || p.phone !== r.phone) updated++;
  p.classification = 'passenger';
  p.route = r.route;
  p.phone = r.phone;
  p.confidence = r.confidence;
  kept.push(p);
}

console.log(
  `Jami: ${posts.length} | saqlanadigan (yo'lovchi): ${kept.length} | DRIVER tashlandi: ${driver} | UNKNOWN tashlandi: ${unknown} | yangilangan: ${updated}`
);
fs.writeFileSync(file, JSON.stringify(kept, null, 2));
console.log('posts.json tozalandi (faqat yo\'lovchilar qoldi).');

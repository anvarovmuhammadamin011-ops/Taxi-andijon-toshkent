import { classifyMessage } from './services/classifier';

async function main() {
  const host = process.env.HOST || 'https://taxi-andijon-toshkent.onrender.com';
  const res = await fetch(`${host}/api/posts`);
  const json: any = await res.json();
  const posts: any[] = json.data || [];
  let p = 0, d = 0, u = 0;
  const passengerTexts: string[] = [];
  const driverThatLookPassenger: string[] = [];
  for (const post of posts) {
    const r = classifyMessage(post.originalText || '');
    if (r.type === 'PASSENGER') { p++; passengerTexts.push(post.originalText); }
    else if (r.type === 'DRIVER') { d++; }
    else { u++; }
    if (post.classification === 'passenger' && r.type !== 'PASSENGER') {
      driverThatLookPassenger.push(`OLD=passenger, NEW=${r.type} | ${post.originalText}`);
    }
  }
  console.log(`TOTAL=${posts.length} PASSENGER=${p} DRIVER=${d} UNKNOWN=${u}`);
  console.log('=== NEW PASSENGER texts ===');
  for (const t of passengerTexts.slice(0, 25)) console.log('P | ' + t.split('\n')[0].slice(0, 90));
  console.log('=== OLD-passenger reclassified ===');
  for (const t of driverThatLookPassenger.slice(0, 10)) console.log(t);
}

main().catch((e) => { console.error(e); process.exit(1); });
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { config } from './src/config';
import * as fs from 'fs';

// Step 1: request login code, persist the CLIENT SESSION (keeps DC routing)
async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: npx ts-node login-step1.ts +998XXXXXXXXX');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(''), config.telegram.apiId, config.telegram.apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log('Connected. Sending code request...');

  const result = await client.sendCode(
    { apiId: config.telegram.apiId, apiHash: config.telegram.apiHash },
    phone
  );

  // Persist the connected client session + hash + phone
  const clientSession = (client.session as StringSession).save();
  fs.writeFileSync('.session-code.json', JSON.stringify({ phone, phoneCodeHash: result.phoneCodeHash, clientSession }, null, 2));
  console.log('CODE SENT. hash + client session persisted to .session-code.json');
  console.log('Run step2 with the code: npx ts-node login-step2.ts <CODE>');

  await client.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e.message || e);
  process.exit(1);
});
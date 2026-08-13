import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q: string) => new Promise<string>((r) => rl.question(q, r));

(async () => {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  if (!apiId || !apiHash) {
    console.error('API_ID va API_HASH .env da bo\'lishi kerak');
    process.exit(1);
  }
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await question('Telefon raqam (+998901234567): '),
    password: async () => await question("2FA parol (yo'qsa bo'sh qoldiring): "),
    phoneCode: async () => await question('Telegramdan kelgan kod: '),
    onError: (e) => console.log('Xato:', e),
  });

  console.log('\n=== SESSION STRING (butun satrni nusxa oling) ===');
  console.log(client.session.save());
  console.log('=====================================================');
  console.log('Bu satrni backend/.env dagi TELEGRAM_SESSION ga qo\'ying.');

  await client.disconnect();
  rl.close();
})();

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import readline from 'readline';
import { config } from './src/config';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log('=== Telegram Session Generator ===\n');

  const client = new TelegramClient(
    new StringSession(''),
    config.telegram.apiId,
    config.telegram.apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => await question('Telefon raqam (+998...): '),
    password: async () => await question('2FA parol (agar bo\'lsa): '),
    phoneCode: async () => await question('Telegram\'dagi kod: '),
    onError: (err) => console.error(err),
  });

  const session = (client.session as StringSession).save();
  console.log('\n=== SESSION (ni .env ga yozing) ===\n');
  console.log(`TELEGRAM_SESSION=${session}`);
  console.log('\n=== Session tayyor! ===');

  rl.close();
  await client.disconnect();
}

main().catch(console.error);

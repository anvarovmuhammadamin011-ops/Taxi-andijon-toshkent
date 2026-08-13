import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const phone = process.argv[2];
const codeFile = 'C:\\Users\\Victus\\AppData\\Local\\Temp\\session_code.txt';
const outFile = 'C:\\Users\\Victus\\AppData\\Local\\Temp\\session_out.txt';

function waitForCode(): Promise<string> {
  return new Promise((resolve) => {
    const check = () => {
      try {
        if (fs.existsSync(codeFile)) {
          const c = fs.readFileSync(codeFile, 'utf8').trim();
          if (c) {
            fs.writeFileSync(codeFile, '');
            return resolve(c);
          }
        }
      } catch {
        /* ignore */
      }
      setTimeout(check, 1000);
    };
    check();
  });
}

(async () => {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });
  console.log('Connecting and sending code to', phone);
  await client.start({
    phoneNumber: async () => phone,
    password: async () => '',
    phoneCode: async () => await waitForCode(),
    onError: (e: any) => console.log('ERR', e),
  } as any);
  const sessionStr: string = (client.session.save() as unknown) as string;
  fs.writeFileSync(outFile, sessionStr);
  console.log('SESSION_SAVED');
  await client.disconnect();
  process.exit(0);
})();

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { config } from './src/config';
import * as fs from 'fs';
import { computeCheck } from 'telegram/Password';

// One-shot login: keeps connection open between code request and code entry
async function main() {
  const phone = process.argv[2];
  const code = process.argv[3];
  const pass2fa = process.argv[4] || '';
  if (!phone || !code) {
    console.error('Usage: npx ts-node login-once.ts +998XXXXXXXXX <CODE> [2FA]');
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(''), config.telegram.apiId, config.telegram.apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log('Connected. Requesting code...');

  const result = await client.sendCode(
    { apiId: config.telegram.apiId, apiHash: config.telegram.apiHash },
    phone
  );
  console.log('Code sent (fresh hash):', result.phoneCodeHash);

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCode: code,
        phoneCodeHash: result.phoneCodeHash,
      })
    );
  } catch (e: any) {
    if (e.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      console.log('2FA required.');
      if (!pass2fa) {
        console.error('Pass 2FA password as 4th arg');
        await client.disconnect();
        process.exit(1);
      }
      const pwd = await client.invoke(new Api.account.GetPassword());
      const check = await computeCheck(pwd, pass2fa);
      await client.invoke(new Api.auth.CheckPassword({ password: check }));
      console.log('2FA passed.');
    } else {
      throw e;
    }
  }

  const session = (client.session as StringSession).save();
  console.log('\n=== SESSION ===');
  console.log(session);
  console.log('=== END ===');
  fs.writeFileSync('.session.txt', session, 'utf8');
  console.log('Session saved to .session.txt');

  await client.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e.message || e);
  process.exit(1);
});
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { config } from './src/config';
import * as fs from 'fs';
import { computeCheck } from 'telegram/Password';

// Step 2: submit code using the SAME client session from step1 (correct DC routing)
async function main() {
  const code = process.argv[2];
  const pass2fa = process.argv[3] || '';
  if (!code) {
    console.error('Usage: npx ts-node login-step2.ts <CODE> [2FA]');
    process.exit(1);
  }

  let saved;
  try {
    saved = JSON.parse(fs.readFileSync('.session-code.json', 'utf8'));
  } catch {
    console.error('Missing .session-code.json - run login-step1.ts first');
    process.exit(1);
  }

  const client = new TelegramClient(
    new StringSession(saved.clientSession),
    config.telegram.apiId,
    config.telegram.apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log('Connected via saved session. Signing in...');

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: saved.phone,
        phoneCode: code,
        phoneCodeHash: saved.phoneCodeHash,
      })
    );
  } catch (e: any) {
    if (e.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      console.log('2FA required.');
      if (!pass2fa) {
        console.error('Pass 2FA password as 3rd arg: npx ts-node login-step2.ts <CODE> <2FA>');
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
import bcrypt from 'bcryptjs';
import { addUser, addChannel, addPost, getUsers, getChannels } from './src/services/storage';
import { Channel, Post } from './src/types';

async function seed() {
  console.log('=== Seeding test data ===\n');

  // Add test channels
  const channels: Partial<Channel>[] = [
    { channelId: 'taxsislar', username: 'taxsislar', title: 'Taksilar', url: 'https://t.me/taxsislar', status: 'active', lastProcessedMessageId: 0, totalCollectedPosts: 0, totalPassengerPosts: 0, totalDriverPosts: 0 },
    { channelId: 'baliqchi2', username: 'baliqchi2', title: 'Baliqchi 2', url: 'https://t.me/baliqchi2', status: 'active', lastProcessedMessageId: 0, totalCollectedPosts: 0, totalPassengerPosts: 0, totalDriverPosts: 0 },
  ];

  for (const ch of channels) {
    const existing = getChannels().find((c) => c.username === ch.username);
    if (!existing) {
      addChannel({
        id: Date.now().toString() + Math.random(),
        channelId: ch.channelId!,
        username: ch.username!,
        title: ch.title!,
        url: ch.url!,
        status: ch.status as any,
        lastProcessedMessageId: 0,
        lastEventTime: null,
        totalCollectedPosts: 0,
        totalPassengerPosts: 0,
        totalDriverPosts: 0,
        addedAt: new Date().toISOString(),
      });
      console.log(`Channel added: ${ch.title}`);
    }
  }

  // Add test user
  const existingUser = getUsers().find((u) => u.login === 'test');
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('test123', 10);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    addUser({
      id: 'test-user-1',
      name: 'Test User',
      telegramId: 8877452838,
      login: 'test',
      passwordHash,
      role: 'user',
      status: 'active',
      monthlyPrice: 50000,
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('User added: test / test123 (Telegram ID: 8877452838)');
  }

  // Add test posts
  const testPosts = [
    { text: 'Тошкентга юрамиз 2та кам машина  kerak', route: 'toshkent_andijon', phone: '998218408' },
    { text: 'Andijonga ketmoqchiman, 3 kishi, mashina kerak', route: 'andijon_toshkent', phone: '901234567' },
    { text: 'Тошкентдан Баликчига юрамиз 2 та одамимиз кам', route: 'toshkent_andijon', phone: '998765432' },
  ];

  for (let i = 0; i < testPosts.length; i++) {
    const p = testPosts[i];
    addPost({
      id: `test-post-${i}`,
      messageId: 1000 + i,
      channelId: 'taxsislar',
      channelTitle: 'Taksilar',
      channelUrl: 'https://t.me/taxsislar',
      originalText: p.text,
      normalizedText: p.text.toLowerCase(),
      route: p.route as any,
      passengerCount: 2,
      phone: p.phone,
      username: null,
      classification: 'passenger',
      confidence: 0.9,
      duplicateFingerprint: p.text.slice(0, 20),
      isDuplicate: false,
      messageDate: new Date().toISOString(),
      collectedAt: new Date().toISOString(),
    });
  }
  console.log(`Added ${testPosts.length} test posts`);

  console.log('\n=== Seed complete ===');
  console.log('Users:', getUsers().length);
  console.log('Channels:', getChannels().length);
  console.log('Posts:', getPosts().length);
}

function getPosts() {
  const { getPosts: gp } = require('./src/services/storage');
  return gp();
}

seed().catch(console.error);

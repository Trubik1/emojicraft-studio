import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://client-wheat-three-83.vercel.app';

if (!token) {
  console.warn('⚠️ Внимание: BOT_TOKEN не указан в файле .env.');
}

export const bot = new Bot(token || 'DUMMY_TOKEN');

// In-memory store for user packs
const userPacks = new Map();

bot.catch((err) => {
  console.error('❌ Ошибка в обработчике бота:', err.message);
});

const isHttps = (url) => url && url.startsWith('https://');

// Command: /start
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard();

  if (isHttps(webAppUrl)) {
    keyboard.webApp('✨ Открыть EmojiCraft Studio', webAppUrl);
  } else {
    keyboard.url('🌐 Открыть в браузере (Dev)', webAppUrl);
  }

  keyboard.row().url('💬 Канал Trubik', 'https://t.me/Trubik11');

  const text = `
✨ **Добро пожаловать в EmojiCraft Studio!**

Студия кастомных анимированных эмодзи и стикеров в Telegram в фирменном Cyber Bento стиле с Ам Нямом:

🎨 **Emoji Studio** — создание 3D букв с Ам Нямом, блеском ✨ и каплями 💧.
🎬 **Media Converter** — нарезка видео/GIF в стикеры (512×512) и эмодзи (100×100) с мемным текстом.
🧩 **Grid Slicer** — нарезка картинок на сетку (2×2, 3×3, 4×4) с правильным обратным порядком для чатов.
🔍 **Emoji Inspector** — определение \`custom_emoji_id\` и ссылки на оригинальные паки.
💬 **Live Chat Simulator** — тест отображения в статусе профиля, сообщении и реакциях.
📁 **Моя коллекция** — локальное сохранение созданных работ.

👇 *Нажмите кнопку ниже, чтобы запустить приложение:*
`;

  await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: 'Markdown',
  });
});

// Command: /newpack
bot.command('newpack', async (ctx) => {
  const title = ctx.match || 'My EmojiCraft Stickers';
  const userId = ctx.from?.id;
  const botInfo = await ctx.api.getMe();
  const shortName = `pack_${userId}_${Date.now().toString(36)}`;
  const packName = `${shortName}_by_${botInfo.username}`;

  userPacks.set(userId, { packName, title, type: 'regular' });

  const keyboard = new InlineKeyboard()
    .webApp('🎨 Создать стикер в Студии', `${webAppUrl}?tab=studio`);

  await ctx.reply(
    `📦 **Стикерпак инициализирован!**\n\n` +
    `• Название: **${title}**\n` +
    `• Ссылка: \`https://t.me/addstickers/${packName}\`\n\n` +
    `Откройте Студию, создайте эмодзи или стикер и скачайте WebM файл!`,
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Listener for messages with Custom Emojis (Emoji ID Finder)
bot.on('message:text', async (ctx, next) => {
  const entities = ctx.message.entities || [];
  const customEmojiEntities = entities.filter((e) => e.type === 'custom_emoji');

  if (customEmojiEntities.length === 0) {
    return next();
  }

  await ctx.replyWithChatAction('typing');

  let response = `🔍 **Обнаружены кастомные эмодзи (${customEmojiEntities.length} шт.):**\n\n`;
  const firstId = customEmojiEntities[0].custom_emoji_id;

  for (let i = 0; i < customEmojiEntities.length; i++) {
    const entity = customEmojiEntities[i];
    const emojiId = entity.custom_emoji_id;
    const char = ctx.message.text.substring(entity.offset, entity.offset + entity.length);

    response += `🔹 **Эмодзи #${i + 1}:** ${char}\n`;
    response += `• \`custom_emoji_id:\` \`${emojiId}\`\n`;
    response += `• \`HTML:\` \`<tg-emoji emoji-id="${emojiId}">${char}</tg-emoji>\`\n`;
    response += `• \`Markdown:\` \`[${char}](tg://emoji?id=${emojiId})\`\n\n`;
  }

  const keyboard = new InlineKeyboard();
  const inspectUrl = `${webAppUrl}?tab=inspector&id=${firstId}`;
  if (isHttps(webAppUrl)) {
    keyboard.webApp('🔍 Инспектировать в Студии', inspectUrl);
  } else {
    keyboard.url('🔍 Инспектировать в Студии', inspectUrl);
  }

  await ctx.reply(response, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
});

// Listener for video or GIF
bot.on(['message:animation', 'message:video', 'message:video_note'], async (ctx) => {
  const keyboard = new InlineKeyboard();
  const mediaUrl = `${webAppUrl}?tab=media`;
  if (isHttps(webAppUrl)) {
    keyboard.webApp('🎬 Конвертировать в Студии', mediaUrl);
  } else {
    keyboard.url('🎬 Конвертировать в Студии', mediaUrl);
  }

  await ctx.reply(
    '📹 **Медиа получено!**\nОткройте Media Converter в Студии, чтобы наложить мемный текст, стикерный контур и конвертировать в Telegram WebM стикер (512×512) или эмодзи (100×100)!',
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Listener for photos
bot.on('message:photo', async (ctx) => {
  const keyboard = new InlineKeyboard();
  const slicerUrl = `${webAppUrl}?tab=slicer`;
  if (isHttps(webAppUrl)) {
    keyboard.webApp('🧩 Нарезать баннер', slicerUrl).row().webApp('🎨 Открыть в Студии', `${webAppUrl}?tab=studio`);
  } else {
    keyboard.url('🧩 Нарезать баннер', slicerUrl);
  }

  await ctx.reply(
    '📸 **Фото получено!**\n\nВыберите действие:\n• **Grid Slicer**: нарезать на сетку (2×2, 3×3, 4×4) со схемой правильной отправки в чат\n• **Emoji Studio**: наложить кастомную 3D букву и эффекты',
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Start bot
if (process.env.BOT_TOKEN) {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 Бот @${botInfo.username} успешно запущен!`);
    },
  });
}

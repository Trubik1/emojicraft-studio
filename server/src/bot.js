import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://localhost:5173';

if (!token) {
  console.warn('⚠️ Внимание: BOT_TOKEN не указан в файле .env. Укажите токен для запуска Telegram бота.');
}

export const bot = new Bot(token || 'DUMMY_TOKEN');

// In-memory store for user packs (in production use SQLite/Postgres)
const userPacks = new Map();

// Command: /start
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('✨ Открыть EmojiCraft Studio', webAppUrl)
    .row()
    .url('💬 Поддержка & Сообщество', 'https://t.me/telegram');

  const text = `
👋 **Добро пожаловать в EmojiCraft Studio!**

Это полноценная студия для создания кастомных анимированных эмодзи и стикеров в Telegram:

🎨 **Emoji Studio** — анимированные буквы со смайлами, блеском ✨ и каплями 💧.
🎬 **Media Converter** — превращение любого видео/GIF в видео-стикер (512x512) или эмодзи (100x100) с мемным текстом!
🧩 **Grid Slicer** — нарезка фото на сетку эмодзи (2×2, 3×3, 4×4) для бесшовных постеров в чате.
🔍 **Emoji Inspector** — определение системных \`custom_emoji_id\` и ссылки на оригинальные паки.
💬 **Live Chat Simulator** — тест отображения в сообщениях и статусе профиля.

📦 **Быстрые команды для паков (как в @MoiStikiBot):**
• \`/newpack <название>\` — создать свой персональный стикерпак
• \`/newemoji <название>\` — создать свой эмодзи-пак (для Premium)

👇 *Нажмите кнопку ниже, чтобы открыть студию прямо в Telegram:*
`;

  await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: 'Markdown',
  });
});

// Command: /newpack (Создание персонального стикерпака в Telegram)
bot.command('newpack', async (ctx) => {
  const title = ctx.match || 'My EmojiCraft Stickers';
  const userId = ctx.from?.id;
  const botInfo = await ctx.api.getMe();
  const shortName = `pack_${userId}_${Date.now().toString(36)}`;
  const packName = `${shortName}_by_${botInfo.username}`;

  userPacks.set(userId, { packName, title, type: 'regular' });

  const keyboard = new InlineKeyboard()
    .webApp('🎨 Создать стикер в Студии', webAppUrl);

  await ctx.reply(
    `📦 **Стикерпак инициализирован!**\n\n` +
    `• Название: **${title}**\n` +
    `• Ссылка пака: \`https://t.me/addstickers/${packName}\`\n\n` +
    `Теперь отправьте мне любое **фото, видео, GIF или файл стикера**, чтобы добавить его первым в этот пак!`,
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Listener for messages with Custom Emojis (Emoji ID Finder like @PremiumEmojidBot)
bot.on('message:text', async (ctx, next) => {
  const entities = ctx.message.entities || [];
  const customEmojiEntities = entities.filter((e) => e.type === 'custom_emoji');

  if (customEmojiEntities.length === 0) {
    return next();
  }

  await ctx.replyWithChatAction('typing');

  let response = `🔍 **Обнаружены кастомные эмодзи (${customEmojiEntities.length} шт.):**\n\n`;

  for (let i = 0; i < customEmojiEntities.length; i++) {
    const entity = customEmojiEntities[i];
    const emojiId = entity.custom_emoji_id;
    const char = ctx.message.text.substring(entity.offset, entity.offset + entity.length);

    response += `🔹 **Эмодзи #${i + 1}:** ${char}\n`;
    response += `• \`custom_emoji_id:\` \`${emojiId}\`\n`;
    response += `• \`HTML tag:\` \`<tg-emoji emoji-id="${emojiId}">${char}</tg-emoji>\`\n`;
    response += `• \`Markdown:\` \`[${char}](tg://emoji?id=${emojiId})\`\n\n`;
  }

  response += `💡 *Используйте эти ID для верстки постов или в коде ваших ботов.*`;

  const keyboard = new InlineKeyboard().webApp('🎨 Открыть в Студии', webAppUrl);

  await ctx.reply(response, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
});

// Listener for video, animation (GIF) or round video note (like @MoiStikiBot)
bot.on(['message:animation', 'message:video', 'message:video_note'], async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('🎬 Открыть в Media Converter', webAppUrl)
    .row()
    .webApp('✨ Сделать кастомный эмодзи (100×100)', webAppUrl);

  await ctx.reply(
    '📹 **Медиа получено!**\nХотите наложить мемный текст, стикерный контур или конвертировать видео/GIF в Telegram WebM стикер?',
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Listener for photos: suggests opening Grid Slicer or adding to pack
bot.on('message:photo', async (ctx) => {
  const userId = ctx.from?.id;
  const currentPack = userPacks.get(userId);

  const keyboard = new InlineKeyboard()
    .webApp('🧩 Нарезать в Grid Slicer', webAppUrl)
    .row()
    .webApp('🎨 Открыть в Студии', webAppUrl);

  let text = '📸 **Фото получено!**\n\nВыберите действие:\n• Нарезать на сетку эмодзи-пазлов (2×2, 3×3, 4×4)\n• Открыть в Студии для наложения букв и эффектов';

  if (currentPack) {
    text += `\n\n💡 *У вас активен пак [${currentPack.title}](https://t.me/addstickers/${currentPack.packName})*.`;
  }

  await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: 'Markdown',
  });
});

// Start bot if run directly
if (process.env.BOT_TOKEN) {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 Бот @${botInfo.username} успешно запущен!`);
    },
  });
}

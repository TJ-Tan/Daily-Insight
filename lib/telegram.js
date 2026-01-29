/**
 * Send messages to Telegram. Splits long content into chunks (max 4096 chars per message).
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

const MAX_MESSAGE_LENGTH = 4000;

/**
 * @param {string} botToken - Telegram Bot token from @BotFather
 * @param {string} chatId - Chat ID (e.g. from @userinfobot)
 * @param {string} text - Plain or Markdown text
 * @param {boolean} [parseMode='HTML'] - 'HTML' or 'Markdown'
 */
export async function sendTelegramMessage(botToken, chatId, text, parseMode = 'HTML') {
  if (!botToken || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
  }
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  const chunks = chunkText(text, MAX_MESSAGE_LENGTH);
  const results = [];
  for (const chunk of chunks) {
    const body = {
      chat_id: chatId,
      text: chunk,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      throw new Error(data.description || `Telegram API error: ${res.status}`);
    }
    results.push(data);
  }
  return results;
}

function chunkText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start) end = lastNewline + 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

/**
 * Build a single formatted message body from category results for Telegram.
 */
export function buildTelegramDigest(dateStr, categoryResults) {
  const lines = [`📅 <b>Daily News Digest — ${dateStr}</b>\n`];
  for (const { label, articles } of categoryResults) {
    if (articles.length === 0) {
      lines.push(`\n<b>${escapeHtml(label)}</b>\nNo articles.\n`);
      continue;
    }
    lines.push(`\n<b>${escapeHtml(label)}</b>\n`);
    articles.forEach((a, i) => {
      const title = escapeHtml((a.title || '').slice(0, 200));
      const summary = escapeHtml((a.summary ?? a.description ?? '').slice(0, 300));
      const link = a.url ? `\n🔗 ${a.url}` : '';
      lines.push(`${i + 1}. ${title}\n${summary}${link}\n`);
    });
  }
  return lines.join('\n');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

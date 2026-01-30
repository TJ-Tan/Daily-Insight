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
 * Starts with date; English first, then Mandarin (content only, no title repeat); no links.
 */
export function buildTelegramDigest(dateStr, categoryResults) {
  const lines = [`📅 <b>${dateStr}</b>\n`];
  for (const { label, articles } of categoryResults) {
    if (articles.length === 0) {
      lines.push(`\n<b>${escapeHtml(label)}</b>\nNo articles.\n`);
      continue;
    }
    lines.push(`\n<b>${escapeHtml(label)}</b>\n`);
    articles.forEach((a, i) => {
      const titleEn = escapeHtml((a.title || '').slice(0, 200));
      const summaryEn = escapeHtml((a.summary ?? a.description ?? '').slice(0, 300));
      const summaryZh = escapeHtml((a.summary_zh || '').slice(0, 300));
      // English: title + summary; Chinese: content only (no title repeat)
      let block = `${i + 1}. ${titleEn}\n${summaryEn}`;
      if (summaryZh) {
        block += `\n\n— 中文 —\n${summaryZh}`;
      }
      lines.push(block + '\n');
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

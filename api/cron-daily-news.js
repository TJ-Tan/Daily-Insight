/**
 * Vercel Cron: daily news digest.
 * Triggered by cron (see vercel.json) or manually with password.
 * Auth: CRON_SECRET — use ?password=YOUR_PASSWORD in URL for testing, or Bearer token (cron).
 */

import { fetchAllCategories } from '../lib/news.js';
import { summarizeCategoryArticles } from '../lib/summarize.js';
import { translateArticlesToMandarin } from '../lib/translate.js';
import { appendDailyNews } from '../lib/sheets.js';
import { sendTelegramMessage, buildTelegramDigest } from '../lib/telegram.js';
import { buildEndSummaryMandarin } from '../lib/endSummary.js';

export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = process.env.CRON_SECRET;
  if (!password) {
    return res.status(503).json({ error: 'CRON_SECRET is not configured' });
  }
  const queryPass = req.query.password;
  const bearerAuth = req.headers.authorization;
  const authorized = queryPass === password || bearerAuth === `Bearer ${password}`;
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const gnewsKey = process.env.GNEWS_API_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!gnewsKey) {
    return res.status(500).json({ error: 'GNEWS_API_KEY is not set' });
  }

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sheetName = 'Daily News';

  try {
    // 1) Fetch news by category
    const categoryResults = await fetchAllCategories(gnewsKey);

    // 2) Optional summarization (uses description if no OpenAI key)
    for (const cat of categoryResults) {
      cat.articles = await summarizeCategoryArticles(cat.articles, openaiKey);
    }

    // 3) Translate to Mandarin (English kept; adds title_zh, summary_zh). Requires OPENAI_API_KEY.
    for (const cat of categoryResults) {
      cat.articles = await translateArticlesToMandarin(cat.articles, openaiKey);
    }

    // 4) Append to Google Sheet by date
    if (spreadsheetId && serviceAccountJson) {
      await appendDailyNews({
        spreadsheetId,
        sheetName,
        dateStr,
        categoryResults,
        serviceAccountJson,
      });
    }

    // 5) Send digest via Telegram (with end summary in Mandarin)
    if (telegramToken && telegramChatId) {
      let digest = buildTelegramDigest(dateStr, categoryResults);
      const endSummary = await buildEndSummaryMandarin(categoryResults, openaiKey);
      if (endSummary) digest += '\n\n' + endSummary;
      await sendTelegramMessage(telegramToken, telegramChatId, digest);
    }

    return res.status(200).json({
      ok: true,
      date: dateStr,
      categories: categoryResults.map((c) => ({ key: c.categoryKey, count: c.articles.length })),
      sheetUpdated: Boolean(spreadsheetId && serviceAccountJson),
      telegramSent: Boolean(telegramToken && telegramChatId),
    });
  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

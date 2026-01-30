/**
 * Build ~100 word Mandarin end summary for Telegram: 投资建议、注意事项、可进一步关注.
 */

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

/**
 * Build a short context string from category results (titles + summaries).
 */
function buildContext(categoryResults) {
  const parts = [];
  for (const { label, articles } of categoryResults) {
    for (const a of articles) {
      const en = (a.title || '') + ' ' + (a.summary ?? a.description ?? '');
      const zh = (a.title_zh || '') + ' ' + (a.summary_zh || '');
      if (en.trim() || zh.trim()) parts.push((zh || en).trim().slice(0, 300));
    }
  }
  return parts.join('\n').slice(0, 6000);
}

/**
 * Call OpenAI to generate ~100 word Mandarin summary with 投资建议、注意事项、可进一步关注.
 * @param {Array} categoryResults
 * @param {string} [apiKey]
 * @returns {Promise<string>}
 */
export async function buildEndSummaryMandarin(categoryResults, apiKey) {
  if (!apiKey) return '';
  const context = buildContext(categoryResults);
  if (!context.trim()) return '';
  try {
    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Based on the following daily news summaries (mix of English and 中文), write a single paragraph in Simplified Chinese (Mandarin), about 100 words, that includes:
1. 投资建议 (suggested action for investment)
2. 需关注事项 (things to take note of)
3. 可进一步关注的主题 (further topics to look into given the trend)

Output only the paragraph, no headings. Keep it concise and practical.

News context:
${context}`,
          },
        ],
        max_tokens: 400,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? `\n<b>📌 今日小结</b>\n\n${text}` : '';
  } catch {
    return '';
  }
}

/**
 * Translate text to Mandarin using OpenAI.
 * If no API key, returns original text (no translation).
 */

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

/**
 * Translate a single string to Simplified Chinese (Mandarin).
 * @param {string} text - English text
 * @param {string} [apiKey]
 * @returns {Promise<string>}
 */
export async function translateToMandarin(text, apiKey) {
  if (!apiKey || !text?.trim()) return text?.trim() || '';
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
            content: `Translate the following to Simplified Chinese (Mandarin). Preserve meaning and keep it concise. Output only the translation, no explanation.\n\n${text.slice(0, 2000)}`,
          },
        ],
        max_tokens: 500,
      }),
    });
    if (!res.ok) return text.trim();
    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    return translated || text.trim();
  } catch {
    return text.trim();
  }
}

/**
 * Translate title and summary of each article to Mandarin. Adds title_zh and summary_zh.
 */
export async function translateArticlesToMandarin(articles, apiKey) {
  if (!apiKey) {
    return articles.map((a) => ({
      ...a,
      title_zh: '',
      summary_zh: '',
    }));
  }
  const out = [];
  for (const a of articles) {
    const title = (a.title || '').trim();
    const summary = (a.summary ?? a.description ?? '').trim();
    const [title_zh, summary_zh] = await Promise.all([
      title ? translateToMandarin(title, apiKey) : '',
      summary ? translateToMandarin(summary, apiKey) : '',
    ]);
    out.push({
      ...a,
      title_zh: title_zh || '',
      summary_zh: summary_zh || '',
    });
  }
  return out;
}

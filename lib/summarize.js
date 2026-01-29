/**
 * Optional AI summarization via OpenAI.
 * If OPENAI_API_KEY is not set, we use the article description as summary.
 */

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

/**
 * Summarize a single article (optional). Falls back to description if no API key.
 * @param {string} title
 * @param {string} description
 * @param {string} [apiKey]
 * @returns {Promise<string>}
 */
export async function summarizeArticle(title, description, apiKey) {
  if (!apiKey) return description?.trim() || title;
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
            content: `Summarize this news in 1-2 short sentences. Title: ${title}. Description: ${description || 'N/A'}`,
          },
        ],
        max_tokens: 150,
      }),
    });
    if (!res.ok) return description?.trim() || title;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || description?.trim() || title;
  } catch {
    return description?.trim() || title;
  }
}

/**
 * Batch summarize articles for a category (optional). If no API key, uses description as summary.
 */
export async function summarizeCategoryArticles(articles, apiKey) {
  if (!apiKey) {
    return articles.map((a) => ({ ...a, summary: a.description?.trim() || a.title }));
  }
  const out = [];
  for (const a of articles) {
    const summary = await summarizeArticle(a.title, a.description, apiKey);
    out.push({ ...a, summary });
  }
  return out;
}

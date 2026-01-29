/**
 * Fetch news from GNews API by category.
 * Docs: https://gnews.io/docs/v4
 */

const GNEWS_BASE = 'https://gnews.io/api/v4';

/**
 * @param {object} opts
 * @param {string} opts.apikey - GNews API key
 * @param {'top-headlines'|'search'} opts.type
 * @param {string} [opts.category] - for top-headlines: general|world|nation|business|technology|entertainment|sports|science|health
 * @param {string} [opts.q] - for search: query
 * @param {number} [opts.max=10]
 * @returns {Promise<{ articles: Array<{ title: string, description: string, url: string, publishedAt: string, source: { name: string } }> }>}
 */
export async function fetchGNews({ apikey, type, category, q, max = 10 }) {
  const params = new URLSearchParams({
    apikey,
    lang: 'en',
    max: String(Math.min(max, 20)),
  });
  if (type === 'top-headlines') {
    params.set('category', category || 'general');
  } else {
    params.set('q', q || 'news');
  }
  const url = `${GNEWS_BASE}/${type}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GNews API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data;
}

/**
 * Fetch all categories' news. Returns array of { categoryKey, label, articles }.
 */
export async function fetchAllCategories(apikey) {
  const { CATEGORIES } = await import('./config.js');
  const results = [];

  for (const cat of CATEGORIES) {
    try {
      const payload =
        cat.type === 'top-headlines'
          ? { apikey, type: 'top-headlines', category: cat.category, max: cat.limit }
          : { apikey, type: 'search', q: cat.q, max: cat.limit };
      const data = await fetchGNews(payload);
      const articles = (data.articles || []).slice(0, cat.limit).map((a) => ({
        title: a.title || '',
        description: a.description || '',
        url: a.url || '',
        publishedAt: a.publishedAt || '',
        source: (a.source && a.source.name) || '',
      }));
      results.push({ categoryKey: cat.key, label: cat.label, articles });
    } catch (err) {
      console.error(`Failed to fetch category ${cat.key}:`, err.message);
      results.push({ categoryKey: cat.key, label: cat.label, articles: [], error: err.message });
    }
  }

  return results;
}

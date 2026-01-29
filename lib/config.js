/**
 * Category definitions for the daily news digest.
 * Each entry: { key, label, limit, type: 'top-headlines'|'search', category (for top-headlines) or q (for search) }
 */
export const CATEGORIES = [
  {
    key: 'world',
    label: 'Top 20 news around the world',
    limit: 20,
    type: 'top-headlines',
    category: 'world',
  },
  {
    key: 'asia-sea',
    label: 'Top 20 news in Asia and SEA',
    limit: 20,
    type: 'search',
    q: 'Asia OR Singapore OR Southeast Asia OR ASEAN',
  },
];

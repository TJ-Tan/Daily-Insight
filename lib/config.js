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
    key: 'singapore-sea',
    label: 'Top 20 news in Singapore and SEA',
    limit: 20,
    type: 'search',
    q: 'Singapore OR Southeast Asia OR ASEAN',
  },
  {
    key: 'it',
    label: 'Top 10 news in IT industry',
    limit: 10,
    type: 'top-headlines',
    category: 'technology',
  },
  {
    key: 'finance',
    label: 'Top 10 news in Finance and Economic industry',
    limit: 10,
    type: 'top-headlines',
    category: 'business',
  },
  {
    key: 'politics',
    label: 'Top 10 news in Politics',
    limit: 10,
    type: 'search',
    q: 'politics',
  },
  {
    key: 'government-policy',
    label: 'Top 10 news in Government Policy',
    limit: 10,
    type: 'search',
    q: 'government policy',
  },
  {
    key: 'energy',
    label: 'Top 10 news in Energy industry',
    limit: 10,
    type: 'search',
    q: 'energy',
  },
  {
    key: 'science',
    label: 'Top 10 news in Science industry',
    limit: 10,
    type: 'top-headlines',
    category: 'science',
  },
  {
    key: 'rare-earth',
    label: 'Top 10 news in Rare Earth & commodities (gold, silver, copper, palladium)',
    limit: 10,
    type: 'search',
    q: 'rare earth OR gold OR silver OR copper OR palladium OR commodities',
  },
];

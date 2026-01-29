# Daily Insight — News Digest on Vercel

A Vercel-hosted workflow that **every day**:

1. **Crawls** news by category (world, Singapore/SEA, IT, Finance, Politics, Government Policy, Energy, Science, Rare Earth & commodities).
2. **Summarizes** headlines (optional AI summarization via OpenAI; otherwise uses article description).
3. **Appends** rows to a **Google Sheet** by date (Date | Category | Title | Summary | Link | Source) so you can revisit later.
4. **Sends** the full digest to you via **Telegram**.

Cron runs **once per day** (default: 6:00 UTC; adjust in `vercel.json`). You can also trigger the job manually by calling `GET /api/cron-daily-news` (protect with `CRON_SECRET` in production).

---

## Quick start

### 1. Clone and install

```bash
cd "Daily Insight"
npm install
```

### 2. Environment variables

Create a [Vercel project](https://vercel.com/new), then in **Project → Settings → Environment Variables** add:

| Variable | Required | Description |
|----------|----------|-------------|
| `GNEWS_API_KEY` | **Yes** | [GNews API](https://gnews.io/register) key (free tier: 100 requests/day). |
| `TELEGRAM_BOT_TOKEN` | **Yes** (for Telegram) | From [@BotFather](https://t.me/BotFather): `/newbot` → copy token. |
| `TELEGRAM_CHAT_ID` | **Yes** (for Telegram) | Your chat ID (e.g. message [@userinfobot](https://t.me/userinfobot), it replies with your ID). |
| `GOOGLE_SHEET_ID` | **Yes** (for Sheet) | From the sheet URL: `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit`. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Yes** (for Sheet) | JSON key for a Google Cloud service account with Sheets API enabled (see below). |
| `OPENAI_API_KEY` | No | If set, uses OpenAI to summarize each article; otherwise uses the article description. |
| `CRON_SECRET` | Recommended | Any secret string. Vercel sends `Authorization: Bearer <CRON_SECRET>` when triggering the cron; your handler checks it. |

#### Google Sheet setup

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project (or use existing).
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials** → **Create credentials → Service account**.
4. Create key (JSON), download the JSON file.
5. In Vercel, add env var `GOOGLE_SERVICE_ACCOUNT_JSON` and paste the **entire JSON** as the value (single line is fine).
6. Open your Google Sheet → **Share** → add the **service account email** (e.g. `xxx@xxx.iam.gserviceaccount.com`) as **Editor**.

### 3. Deploy

```bash
npx vercel
```

Cron runs only on **production** deployments. To run daily at a different time, edit `vercel.json`:

```json
"schedule": "0 6 * * *"
```

Cron uses **UTC**. Examples: `0 6 * * *` = 6:00 UTC; for 8:00 Singapore time (UTC+8) use `0 22 * * *` (previous day 22:00 UTC).

### 4. Manual run

- **With CRON_SECRET:**  
  `curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://YOUR_PROJECT.vercel.app/api/cron-daily-news"`
- **Without CRON_SECRET:**  
  `curl "https://YOUR_PROJECT.vercel.app/api/cron-daily-news"`

---

## Categories and limits

| Category | Limit | Source |
|----------|-------|--------|
| Top 20 news around the world | 20 | GNews top-headlines (world) |
| Top 20 news in Singapore and SEA | 20 | GNews search (Singapore, Southeast Asia, ASEAN) |
| Top 10 IT | 10 | GNews top-headlines (technology) |
| Top 10 Finance & Economic | 10 | GNews top-headlines (business) |
| Top 10 Politics | 10 | GNews search |
| Top 10 Government Policy | 10 | GNews search |
| Top 10 Energy | 10 | GNews search |
| Top 10 Science | 10 | GNews top-headlines (science) |
| Top 10 Rare Earth & commodities | 10 | GNews search (gold, silver, copper, palladium, etc.) |

---

## Sheet layout (Excel)

The **Daily News** tab in your Google Sheet is updated with one row per article. You can **File → Download → Microsoft Excel (.xlsx)** anytime to get an Excel file for the same data.

| Date | Category | Title | Summary | Link | Source |

New rows are appended each day so you can filter or sort by date in Excel/Sheets.

---

## Limits and tips

- **Vercel Hobby:** Cron can run at most once per day; function timeout may be 10s (Pro: longer). If the run times out, add fewer categories or skip optional summarization.
- **GNews free tier:** 100 requests/day. This workflow uses multiple requests per run; one run per day stays within the free tier.
- **Telegram:** Messages longer than 4096 characters are split automatically into multiple messages.
- **Optional:** For longer-running jobs, consider Vercel Pro (higher timeout) or an external cron that calls your API route.

---

## Project structure

```
api/
  cron-daily-news.js   # Cron handler: fetch → summarize → sheet → Telegram
lib/
  config.js            # Category definitions and limits
  news.js              # GNews API client
  summarize.js         # Optional OpenAI summarization
  sheets.js            # Google Sheets append by date
  telegram.js          # Telegram send with chunking
vercel.json            # Cron schedule and function config
package.json
```

# DniGhtX Commission Platform
Node.js + Express + Turso (free SQLite cloud database). Site at `/`, admin at `/admin.html`.

## Run on your computer
1. Install Node 20.12+ (22 recommended).
2. `npm install`
3. Copy `.env.example` to `.env`. For local testing you can delete the two TURSO lines; orders then go to a local file `dnightx.db`.
4. `npm start`, open http://localhost:3000

## Free hosting (Render + Turso + GitHub)
1. **GitHub:** create a free account, make a new repository, upload all these files (do not upload `.env`).
2. **Turso (database):** sign up at turso.tech (free). Create a database. Copy its URL (`libsql://...`) and create a token. These are TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
3. **Render (website):** sign up at render.com. New > Web Service > connect your GitHub repo. Runtime Node, build command `npm install`, start command `npm start`, plan Free.
4. In Render > Environment add every variable from `.env.example` (ADMIN_PASSWORD, SESSION_SECRET, SITE_URL = your Render address, the two TURSO values, ANTHROPIC_API_KEY optional) plus `NODE_ENV=production` and `NODE_VERSION=22`.
5. Deploy. Open your Render address. Log in at `/admin.html`.
Orders are stored in Turso, so they survive restarts. Note: Render's free plan sleeps after about 15 minutes without visitors, so the first visit can take around 30 seconds.

## Google
1. Go to search.google.com/search-console, add your site (URL prefix).
2. Verify with the HTML tag Google gives you (add it inside `<head>` of `index.html`).
3. Submit `YOUR-SITE/sitemap.xml` and use Inspect URL > Request indexing on your home page.
`/robots.txt` and `/sitemap.xml` are generated automatically from SITE_URL. The admin page is hidden from Google.

## AI questions
Each service in `services.js` has its own question list. If ANTHROPIC_API_KEY is set, the AI adds one follow-up question. The key stays on the server.

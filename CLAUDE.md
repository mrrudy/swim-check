# swim-check Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-30

## Active Technologies
- TypeScript 5.3.3, Node.js 20 LTS (backend), TypeScript with React 18.2 (frontend) + Express.js 4.18.2 (backend), React 18.2.0, React Router DOM 6.21.3 (frontend), Vite 5.0.12 (build) (002-slot-navigation)
- sql.js 1.10.0 (SQLite in JavaScript) for user preferences and favorites (002-slot-navigation)
- TypeScript 5.3.3, Node.js 20 LTS (ES2022 target) + Express.js 4.18.2, sql.js 1.10.0, cheerio, pdf-parse (003-midnight-rescrape)
- SQLite via sql.js (`./swim-check.db`) (003-midnight-rescrape)

- TypeScript (Node.js 20 LTS) for backend; TypeScript for frontend + Express.js (REST API), React 18 (frontend), Cheerio/Puppeteer (web scraping) (001-swim-lane-booking)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (Node.js 20 LTS) for backend; TypeScript for frontend: Follow standard conventions

## Recent Changes
- 003-midnight-rescrape: Added TypeScript 5.3.3, Node.js 20 LTS (ES2022 target) + Express.js 4.18.2, sql.js 1.10.0, cheerio, pdf-parse
- 002-slot-navigation: Added TypeScript 5.3.3, Node.js 20 LTS (backend), TypeScript with React 18.2 (frontend) + Express.js 4.18.2 (backend), React 18.2.0, React Router DOM 6.21.3 (frontend), Vite 5.0.12 (build)

- 001-swim-lane-booking: Added TypeScript (Node.js 20 LTS) for backend; TypeScript for frontend + Express.js (REST API), React 18 (frontend), Cheerio/Puppeteer (web scraping)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

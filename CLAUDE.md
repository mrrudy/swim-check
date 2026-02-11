# swim-check Development Guidelines

## Tech Stack
- **Backend:** TypeScript 5.3.3, Node.js 20 LTS, Express.js 4.18.2, sql.js 1.10.0, Cheerio
- **Frontend:** TypeScript, React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12
- **Database:** SQLite via sql.js (`./swim-check.db`)

## Project Structure

```text
packages/
  backend/    # Express.js API server
  frontend/   # React + Vite SPA
  shared/     # Shared TypeScript types
docs/         # Architecture and design documentation
```

## Commands

```bash
npm install   # Install all workspace dependencies
npm run dev   # Start dev servers (frontend + backend)
npm run build # Build for production
npm test      # Run all tests
npm run lint  # Lint all packages
```

## Code Style

TypeScript with standard conventions. Follow existing patterns in the codebase.

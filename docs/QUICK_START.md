# Quick Start: Setting Up Your TypeScript Monorepo

**Time to complete**: ~30 minutes

---

## Step 1: Initialize pnpm Workspace

```bash
# Create root package.json
cat > package.json << 'EOF'
{
  "name": "swim-check",
  "version": "0.1.0",
  "private": true,
  "description": "Swimming lane availability checker",
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "type-check": "pnpm -r run type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

# Create workspace configuration
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Create root tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@db/*": ["packages/db/src/*"]
    }
  }
}
EOF

# Install
pnpm install
```

---

## Step 2: Create Workspace Packages

### Create directory structure
```bash
mkdir -p apps/backend apps/frontend packages/shared packages/db
```

### Create shared types package

**`packages/shared/package.json`**:
```json
{
  "name": "@shared/types",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

**`packages/shared/tsconfig.json`**:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**`packages/shared/src/index.ts`**:
```typescript
// Types
export interface PoolInfo {
  id: string;
  name: string;
  location: string;
  lanes: number;
}

export interface LaneAvailability {
  laneId: number;
  status: "available" | "booked" | "maintenance";
}

export interface AvailabilitySlot {
  poolId: string;
  date: string;
  startTime: string;
  endTime: string;
  lanes: LaneAvailability[];
  availableCount: number;
}

export interface GetAvailabilityRequest {
  poolId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface GetAvailabilityResponse {
  success: boolean;
  data?: AvailabilitySlot;
  error?: string;
  timestamp: string;
}
```

---

## Step 3: Setup Backend

**`apps/backend/package.json`**:
```json
{
  "name": "@swim-check/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/types": "workspace:*",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

**`apps/backend/tsconfig.json`**:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

**`apps/backend/src/index.ts`**:
```typescript
import express from "express";
import type { GetAvailabilityResponse } from "@shared/types";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/availability", (req, res) => {
  const response: GetAvailabilityResponse = {
    success: true,
    data: {
      poolId: req.body.poolId,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      lanes: [
        { laneId: 1, status: "available" },
        { laneId: 2, status: "booked" },
        { laneId: 3, status: "available" }
      ],
      availableCount: 2
    },
    timestamp: new Date().toISOString()
  };
  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
});
```

---

## Step 4: Setup Frontend

**`apps/frontend/package.json`**:
```json
{
  "name": "@swim-check/frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.7"
  }
}
```

**`apps/frontend/tsconfig.json`**:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"]
}
```

**`apps/frontend/vite.config.ts`**:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
```

**`apps/frontend/index.html`**:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swim Check</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`apps/frontend/src/main.tsx`**:
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**`apps/frontend/src/App.tsx`**:
```typescript
import { useState } from "react";
import type { GetAvailabilityRequest, GetAvailabilityResponse } from "@shared/types";

export default function App() {
  const [availability, setAvailability] = useState<GetAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFetchAvailability() {
    setLoading(true);
    try {
      const request: GetAvailabilityRequest = {
        poolId: "pool-1",
        date: "2026-01-30",
        startTime: "14:00",
        endTime: "15:00"
      };

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      const data: GetAvailabilityResponse = await response.json();
      setAvailability(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Swim Check - Lane Availability</h1>
      <button onClick={handleFetchAvailability} disabled={loading}>
        {loading ? "Loading..." : "Check Availability"}
      </button>

      {availability && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h2>Results:</h2>
          <pre>{JSON.stringify(availability, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Install Dependencies & Run

```bash
# Install all dependencies (from root)
pnpm install

# Start development (both backend and frontend)
pnpm dev

# In separate terminal - check backend directly
curl -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"poolId":"pool-1","date":"2026-01-30","startTime":"14:00","endTime":"15:00"}'

# Frontend runs on http://localhost:5173
```

---

## Step 6: Add SQLite Database Layer (Optional - Phase 2)

When ready, add the database package:

```bash
# Create db package
mkdir -p packages/db/src

# Install better-sqlite3
pnpm add -F @swim-check/backend better-sqlite3

# Create database layer
```

**`packages/db/package.json`**:
```json
{
  "name": "@db/database",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/types": "workspace:*",
    "better-sqlite3": "^9.2.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "typescript": "^5.3.3"
  }
}
```

---

## Verification Checklist

- [ ] Root `pnpm-workspace.yaml` created
- [ ] Root `tsconfig.json` created
- [ ] `packages/shared` package created with types
- [ ] `apps/backend` Express server running on port 3000
- [ ] `apps/frontend` React app running on port 5173
- [ ] Frontend can call backend API via proxy
- [ ] Type checking passes: `pnpm type-check`
- [ ] Backend and frontend import types from `@shared/types`

---

## Next Steps

1. **Implement database layer** → Follow Step 6
2. **Add pool scrapers** → Extend backend with BasePoolScraper
3. **Build UI components** → Create React components for pool selection, availability display
4. **Add persistence** → Store favorites locally using localStorage
5. **Deploy** → Docker + hosting (Vercel, Railway, or self-hosted)


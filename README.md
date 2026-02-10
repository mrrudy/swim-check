check availability of swimming pools

## Prerequisites

- Node.js 20 LTS or higher
- npm 9+

## Project Structure

```
packages/
  backend/    # Express.js API server
  frontend/   # React + Vite SPA
  shared/     # Shared TypeScript types
```

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Servers

```bash
npm run dev
```

This starts both:
- Frontend: http://localhost:5173 (Vite dev server with HMR)
- Backend: http://localhost:3000 (Express API with hot reload via tsx)

### Run Only Backend or Frontend

```bash
# Backend only
cd packages/backend && npm run dev

# Frontend only
cd packages/frontend && npm run dev
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests by Package

```bash
# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test
```

### Watch Mode

```bash
cd packages/backend && npx vitest --watch
cd packages/frontend && npx vitest --watch
```

## Linting

```bash
npm run lint
```

## Production Deployment

### Install Node.js & npm

#### Windows

Download and run the Node.js 20 LTS installer from https://nodejs.org/. The installer includes npm. Verify:

```powershell
node --version   # v20.x.x
npm --version    # 9+
```

#### macOS

Using Homebrew:

```bash
brew install node@20
```

Or download the `.pkg` installer from https://nodejs.org/.

Verify:

```bash
node --version   # v20.x.x
npm --version    # 9+
```

#### Linux

##### Ubuntu / Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

##### Fedora

```bash
sudo dnf module enable nodejs:20
sudo dnf install nodejs
```

##### Arch Linux

```bash
sudo pacman -S nodejs npm
```

##### openSUSE

```bash
sudo zypper install nodejs20
```

##### Alternative: nvm (any distro)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Verify:

```bash
node --version   # v20.x.x
npm --version    # 9+
```

### Install the App

Clone the repository and install dependencies:

```bash
git clone https://github.com/mrrudy/swim-check/
cd swim-check
npm install
```

This installs dependencies for all workspace packages (backend, frontend, shared).

### Build

```bash
npm run build
```

This builds:
- Frontend: `packages/frontend/dist/` (static files)
- Backend: `packages/backend/dist/` (compiled JS)

### Run on Network Interface (not localhost)

#### Backend

Set the `HOST` environment variable to bind to all interfaces:

```bash
# Linux/macOS
HOST=0.0.0.0 PORT=3000 node packages/backend/dist/index.js

# Windows PowerShell
$env:HOST="0.0.0.0"; $env:PORT="3000"; node packages/backend/dist/index.js

# Windows CMD
set HOST=0.0.0.0 && set PORT=3000 && node packages/backend/dist/index.js
```

Or create a `.env` file in `packages/backend/`:
```
HOST=0.0.0.0
PORT=3000
```

#### All-in-One (Recommended)

The backend automatically serves the frontend static files if `packages/frontend/dist/` exists. Just build and run:

```bash
npm run build

# Linux/macOS
HOST=0.0.0.0 PORT=3000 node packages/backend/dist/index.js

# Windows PowerShell
$env:HOST="0.0.0.0"; $env:PORT="3000"; node packages/backend/dist/index.js
```

Access the app at `http://<your-ip>:3000`

#### Alternative: nginx Reverse Proxy

For more control, use nginx to serve frontend static files and proxy API requests:

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-server.local;

    location / {
        root /path/to/packages/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Access from Other Devices

Once running on `0.0.0.0`, access the app using your machine's IP address:
- Find your IP: `ipconfig` (Windows) or `ip addr` (Linux)
- Access: `http://<your-ip>:3000`

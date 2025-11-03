# Front-end quick start

This Svelte + Vite app powers the Sophia ordering assistant demo. It expects the Fastify backend to be running so it can fetch the restaurant menu and chat responses.

## Prerequisites

- Node.js 18+
- npm 9+

## Install dependencies

```bash
npm install
```

## Run the development server

```bash
npm run dev -- --open
```

The command prints a local URL (usually <http://localhost:5173>) and opens it in your browser. The front-end will call the backend API at `http://localhost:3000` by default.

If your backend runs somewhere else, add a `.env` file next to this README with:

```bash
VITE_API_BASE=https://your-backend-host
```

Then restart the dev server so Vite picks up the new environment variable.

## Build for production

```bash
npm run build
```

The static assets will be output to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Troubleshooting

- Make sure the backend is running; otherwise chat requests will fail.
- If you see network errors, double-check the `VITE_API_BASE` value and confirm CORS is allowed from your front-end origin.

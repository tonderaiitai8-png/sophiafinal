# Sophia Agora Demo

This repository contains a demo of the **Sophia** restaurant-ordering assistant. It is split into a Fastify + TypeScript backend API and a Svelte + Vite front-end that consumes that API.

If you have downloaded the project as a `.zip` and opened it in VS Code, follow the steps below to run the experience locally.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (the tooling relies on modern ECMAScript and Vite features).
- npm 9+ (ships with recent Node.js versions).
- Two terminal windows or split panes in VS Code.

## 1. Install dependencies

Run the commands below from the repository root. They install the required packages for both the API and the front-end.

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2. Start the backend API

In the `backend` directory run:

```bash
npm run dev
```

This starts a Fastify server on <http://localhost:3000>. You should see log output that confirms the server is listening. Keep this process running.

## 3. Start the Svelte front-end

Open a new terminal, move into the `frontend` directory, and start the Vite dev server:

```bash
npm run dev -- --open
```

Vite will report the local URL (typically <http://localhost:5173>) and automatically open the browser. The front-end is configured to talk to the backend at `http://localhost:3000`. If you need to point it somewhere else, create a `.env` file inside `frontend/` with the following content and restart the dev server:

```bash
VITE_API_BASE=https://your-backend-host
```

## 4. Try the demo

With both servers running you can chat with the assistant, browse the menu, and watch the live cart update. Use the quick prompts or type natural language requests like “Add two Hot Stuff burgers”.

## Useful commands

- **Backend**
  - `npm run build` – compile the TypeScript API into `dist/`.
  - `npm run start` – run the compiled API after building.
- **Frontend**
  - `npm run build` – create an optimized production build in `dist/`.
  - `npm run preview` – preview the production build locally after running `build`.

## Troubleshooting

- If you see missing module errors, make sure you ran `npm install` in both `backend` and `frontend`.
- If the front-end cannot reach the API, confirm the backend is running on port 3000 or update `VITE_API_BASE` to match the backend host.
- Both projects assume Node.js 18+. Upgrade Node if you encounter syntax errors about `import` or `fetch`.

Happy demoing!

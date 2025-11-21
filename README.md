# The Boost Nation — About & Landing

## Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`.

## Run
- Start dev server (serves static files and OpenRouter proxy): `npm run dev`
- Open `http://localhost:3000/index.html` or `http://localhost:3000/about.html`

## OpenRouter proxy
- Endpoint: `POST /api/chat`
- Body: `{ "message": "Your prompt here" }`
- The front-end chat falls back to scripted replies if the proxy fails.

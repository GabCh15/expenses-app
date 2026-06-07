# Gasto — Personal Expense Tracker

Telegram bot + web dashboard for tracking personal expenses.

## Features

- 📱 **Telegram bot**: log expenses on-the-go with natural language
- 📊 **Web dashboard**: KPIs, charts, category breakdown
- 🤖 **AI-powered**: LLM fallback for parsing free-form text
- 🔐 **Auth**: email/password + GitHub OAuth + JWT
- 🌗 **Dark mode**
- 💱 **Multi-currency**: USD, COP, EUR per expense

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Bot**: Telegraf (Telegram Bot API)
- **AI**: OpenRouter (Gemini Flash)

## Project Structure

```
packages/
├── shared/    — Zod schemas, types, constants
├── server/    — Express API + Telegram bot
└── client/    — React SPA
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (Neon free tier recommended)
- Telegram Bot Token (from @BotFather)
- GitHub OAuth App (for web login)
- OpenRouter API key (optional, for AI parser fallback)

### Setup

1. Clone and install:
   ```bash
   git clone ... && npm install
   ```
2. Copy `.env.example` to `.env` and fill in values
3. Run migrations:
   ```bash
   npm run db:migrate -w packages/server
   ```
4. Start dev:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5173

## API Documentation

Start the server and visit http://localhost:3000/api/docs

## License

MIT


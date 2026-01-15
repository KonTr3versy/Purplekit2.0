# PurpleKit

**Purple Team Operations Management Platform**

A modern web application for coordinating red team attacks with blue team detection validation, tracking coverage against MITRE ATT&CK, and generating actionable reports.

## 🏗️ Project Structure

```
purplekit/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── index.ts     # Entry point
│   │   │   ├── app.ts       # Express app setup
│   │   │   ├── config.ts    # Environment config
│   │   │   ├── lib/         # Database, Redis, Logger
│   │   │   ├── middleware/  # Auth, Error handling, Rate limiting
│   │   │   └── routes/      # API route handlers
│   │   └── package.json
│   │
│   └── web/                 # React SPA (Vite + TailwindCSS)
│       ├── src/
│       │   ├── main.tsx     # Entry point
│       │   ├── App.tsx      # Root component
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── stores/      # Zustand stores
│       │   └── styles/      # Global CSS
│       └── package.json
│
├── packages/
│   ├── database/            # Prisma schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── rls-policies.sql
│   │   └── package.json
│   │
│   └── shared/              # Shared types & utilities
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── docker/                  # Docker configuration
│   └── postgres/
│       └── init.sql
│
├── docker-compose.yml       # Local development services
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json (workspaces)
└── .env.example            # Environment template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm 10+

### 1. Clone and Install

```bash
git clone <repository-url>
cd purplekit
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO, Mailhog
docker-compose up -d

# Optional: Start with admin tools (pgAdmin, Redis Commander)
docker-compose --profile tools up -d
```

### 3. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings (defaults work for local dev)
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both API and Web in parallel
npm run dev
```

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

### Demo Credentials

| Email | Role | Password |
|-------|------|----------|
| malcolm@acme.com | Red Team Lead | demo123! |
| sarah@acme.com | Blue Team Lead | demo123! |
| mike@acme.com | Analyst | demo123! |
| admin@acme.com | Admin | demo123! |

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Sessions, caching, job queue |
| MinIO (API) | 9000 | S3-compatible object storage |
| MinIO (Console) | 9001 | MinIO web UI |
| Mailhog (SMTP) | 1025 | Email testing |
| Mailhog (UI) | 8025 | Email web UI |
| pgAdmin* | 5050 | Database admin |
| Redis Commander* | 8081 | Redis admin |

*\*Only with `--profile tools`*

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset volumes (delete all data)
docker-compose down -v
```

## 📜 Available Scripts

### Root Level

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run test         # Run all tests
npm run typecheck    # TypeScript check all apps
npm run clean        # Clean all build artifacts
```

### Database

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

### Docker

```bash
npm run docker:up    # Start Docker services
npm run docker:down  # Stop Docker services
npm run docker:logs  # View logs
```

## 🔧 Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache/Queue**: Redis 7 with BullMQ
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Logging**: Pino

### Frontend

- **Framework**: React 18
- **Build**: Vite
- **Routing**: React Router v6
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod

### Infrastructure

- **Monorepo**: Turborepo
- **Package Manager**: npm workspaces
- **Object Storage**: MinIO (S3-compatible)
- **Email**: Mailhog (dev), SendGrid (prod)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo pipeline config |
| `docker-compose.yml` | Local dev infrastructure |
| `.env.example` | Environment variable template |
| `packages/database/prisma/schema.prisma` | Database schema |
| `apps/api/src/config.ts` | API configuration |
| `apps/web/tailwind.config.js` | Tailwind theme |

## 🔐 Environment Variables

See `.env.example` for all available options. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `S3_*` | Object storage configuration |
| `SMTP_*` | Email configuration |

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📖 API Documentation

The OpenAPI specification is available at `openapi.yaml`. You can view it with:

```bash
# Install Redocly CLI
npm install -g @redocly/cli

# Preview documentation
redocly preview-docs openapi.yaml
```

## 🚢 Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database URL
4. Setup S3 bucket (AWS or compatible)
5. Configure SMTP for emails
6. Setup monitoring (Sentry, etc.)

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run `npm run lint && npm run test`
4. Submit pull request

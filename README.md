# PurpleKit 2.0

**Purple Team Operations Management Platform**

A modern web application that helps security teams coordinate red team attacks with blue team detection validation, track coverage against MITRE ATT&CK, and generate actionable reports.

## 🎯 What is PurpleKit?

PurpleKit bridges the gap between offensive and defensive security teams by:

- **Coordinating Attacks**: Plan and execute red team operations with full lifecycle tracking
- **Validating Detections**: Blue team validates what was detected, alerted, or prevented
- **Measuring Metrics**: Track TTD (Time to Detect), TTI (Time to Investigate), TTC (Time to Contain), TTR (Time to Remediate)
- **Documenting Gaps**: Categorize findings by People, Process, or Technology
- **Visualizing Coverage**: ATT&CK matrix heat maps showing tested techniques
- **Generating Reports**: Professional reports for stakeholders and compliance

## ✨ Features

### ✅ Implemented
- **Authentication** - JWT-based auth with access/refresh tokens
- **Engagements** - Full CRUD for purple team operations
  - List view with search, filtering, and pagination
  - Detail view with stats and progress tracking
  - Create/edit engagements with validation
  - Template cloning for reusable playbooks
  - Status workflow (Planning → Active → Complete → Archived)
- **Techniques Management** - Complete API for ATT&CK techniques
  - Add/remove techniques from engagements
  - Bulk add up to 50 techniques at once
  - Status tracking (Planned → Executing → Validating → Complete)
  - Assignment and dependency management
- **ATT&CK Integration** - Browse MITRE ATT&CK framework
  - Search and filter by tactic, platform, ID or name
  - View technique details with subtechniques
  - Parent/child technique relationships
- **Action Logging** - Red team execution tracking (API Complete)
  - Log attack executions with command, target, and timestamps
  - Evidence file tracking
  - Automatic technique status updates
- **Detection Validation** - Blue team validation (API Complete)
  - Record detection outcomes (Logged, Alerted, Prevented, Not Logged)
  - Link to defensive tools and data sources
  - Alert priority and false positive tracking
- **Findings** - Gap documentation (API Complete)
  - People/Process/Technology (PPT) categorization
  - Severity prioritization (Critical → Info)
  - Remediation effort tracking
  - Status workflow (Open → In Progress → Resolved)
- **Multi-tenancy** - Organization-scoped data with RLS policies
- **API Foundation** - RESTful API with OpenAPI spec
- **Web Application** - React SPA with Vite and TailwindCSS

### 🚧 Coming Soon
- **Kanban Board UI** - Drag-and-drop workflow for technique execution
- **Action/Validation UI** - Forms and detail views for execution tracking
- **Findings UI** - Interface for gap documentation
- **Analytics Dashboard** - Metrics, timing charts, and trends
- **Heat Maps** - ATT&CK matrix visualization
- **Report Generation** - Async PDF/HTML report generation

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (with npm 10+)
- **Docker** & Docker Compose
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Purplekit2.0/purplekit

# 2. Install dependencies
npm install

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, Mailhog)
docker-compose up -d

# 4. Setup database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed demo data

# 5. Start development servers
npm run dev
```

### Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **MinIO Console**: http://localhost:9001
- **Mailhog UI**: http://localhost:8025

### Demo Credentials

| Email | Role | Password |
|-------|------|----------|
| malcolm@acme.com | Red Team Lead | demo123! |
| sarah@acme.com | Blue Team Lead | demo123! |
| mike@acme.com | Analyst | demo123! |
| admin@acme.com | Admin | demo123! |

## 📁 Project Structure

```
Purplekit2.0/
└── purplekit/                    # Main application monorepo
    ├── apps/
    │   ├── api/                  # Express.js API server
    │   │   ├── src/
    │   │   │   ├── routes/       # API route handlers
    │   │   │   ├── middleware/   # Auth, errors, rate limiting
    │   │   │   └── lib/          # Database, Redis, logger
    │   │   └── package.json
    │   │
    │   └── web/                  # React SPA
    │       ├── src/
    │       │   ├── pages/        # Page components
    │       │   ├── components/   # Reusable UI components
    │       │   ├── stores/       # Zustand stores
    │       │   └── lib/          # API client, utilities
    │       └── package.json
    │
    ├── packages/
    │   ├── database/             # Prisma schema & migrations
    │   │   ├── prisma/
    │   │   │   ├── schema.prisma # Database schema
    │   │   │   ├── seed.ts       # Demo data
    │   │   │   └── migrations/   # SQL migrations
    │   │   └── package.json
    │   │
    │   └── shared/               # Shared types & utilities
    │
    ├── docker-compose.yml        # Local dev infrastructure
    ├── OPENAPI.yaml             # API specification
    ├── README.md                # Detailed documentation
    └── package.json             # Root workspace config
```

## 🔧 Tech Stack

### Backend
- **Express.js** - Web framework
- **PostgreSQL 15** - Primary database
- **Prisma ORM** - Type-safe database access
- **Redis 7** - Caching and job queue
- **JWT** - Authentication
- **Zod** - Runtime validation
- **Pino** - Structured logging

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **TanStack Query** - Data fetching
- **React Router v6** - Routing
- **Zustand** - State management
- **React Hook Form** - Forms
- **Lucide React** - Icons

### Infrastructure
- **Turborepo** - Monorepo build system
- **MinIO** - S3-compatible object storage
- **BullMQ** - Background jobs
- **Mailhog** - Email testing (dev)

## 📚 Documentation

- **[Detailed README](./purplekit/README.md)** - Full documentation with all commands
- **[OpenAPI Spec](./purplekit/OPENAPI.yaml)** - Complete API documentation
- **[Database Schema](./purplekit/packages/database/prisma/schema.prisma)** - Data models
- **[Development Brief](./purplekit/CLAUDE_CODE_BRIEF.md)** - Architecture and patterns

## 🛠️ Common Commands

```bash
# Development
npm run dev                # Start all apps
npm run build              # Build all apps
npm run lint               # Lint all code
npm run test               # Run all tests

# Database
npm run db:studio          # Open Prisma Studio (GUI)
npm run db:seed            # Reseed demo data
npm run db:reset           # Reset database

# Docker
npm run docker:up          # Start services
npm run docker:down        # Stop services
npm run docker:logs        # View logs
```

## 🏗️ Development Status

### Phase 1: Core CRUD ✅ COMPLETE
- [x] **Engagements API** (GET, POST, PATCH, DELETE)
- [x] **Engagements UI** (List, Detail, Create, Edit)
- [x] **Techniques API** (GET, POST, PATCH, DELETE, Bulk Add)
- [x] **Techniques UI** (Basic integration)
- [x] **ATT&CK API** (Browse, Search, Filter techniques)

### Phase 2: Workflow ✅ APIs COMPLETE
- [x] **Actions API** (Red team execution logging)
- [x] **Validations API** (Blue team detection validation)
- [ ] Kanban Board UI
- [ ] Action/Validation UI

### Phase 3: Insights - APIs COMPLETE
- [x] **Findings API** (Gap documentation with PPT)
- [ ] Findings UI
- [ ] Analytics API
- [ ] Heat Map UI

### Phase 4: Reports
- [ ] Report Generation
- [ ] Navigator Export

## 🐳 Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & job queue |
| MinIO (API) | 9000 | Object storage |
| MinIO (Console) | 9001 | Storage admin UI |
| Mailhog (SMTP) | 1025 | Email testing |
| Mailhog (UI) | 8025 | Email viewer |

## 🔐 Security Features

- **JWT Authentication** - Access + refresh token flow
- **Row-Level Security** - Multi-tenant data isolation
- **Role-Based Access** - Admin, Red/Blue Lead, Analyst, Observer
- **Rate Limiting** - API endpoint protection
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Prisma ORM
- **CORS Configuration** - Restricted origins

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint && npm run test`
4. Commit with clear messages
5. Submit a pull request

## 📝 License

Proprietary - All rights reserved

---

**Need Help?**
- Check the [detailed README](./purplekit/README.md) for more information
- Review the [OpenAPI spec](./purplekit/OPENAPI.yaml) for API details
- See the [development brief](./purplekit/CLAUDE_CODE_BRIEF.md) for architecture

Built with ❤️ for Purple Teams

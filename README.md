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
- **MITRE ATT&CK Browser** - Interactive technique exploration
  - Search and filter by tactic, platform, ID or name
  - View technique details with subtechniques and metadata
  - Parent/child technique relationships
  - Add techniques directly to engagements from browser
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
- **Report Generation** - Professional reports for engagements
  - Executive summary with key metrics
  - Detailed technique analysis
  - Findings breakdown by severity and pillar
  - Export to PDF and HTML formats
  - Async generation with job queue
- **User Management** - Admin interface for team management
  - Invite users with email and role assignment
  - Edit user roles, names, and status
  - Deactivate users (soft delete)
  - Business rules to prevent admin lockout
  - Role-based visibility and permissions
- **Settings/Configuration** - Organization-wide preferences
  - Profile settings (timezone, date/time formats)
  - Report settings (default type and format)
  - Security settings (session timeout, password policy)
  - Admin-only editing with read-only view for others
- **Analytics Dashboard** - Organization-wide metrics and insights
  - 4 KPI cards: Total Engagements, Detection Rate, Avg TTD, Critical Findings
  - 6 interactive charts using Recharts
  - Engagements over time (line chart)
  - Detection rate by tool (bar chart)
  - Findings by pillar (donut chart)
  - Response times comparison (grouped bar chart)
  - Actions over time (area chart)
  - Findings by severity across engagements (stacked bar)
  - Date range filtering (7, 30, 90, 365 days)
- **Multi-tenancy** - Organization-scoped data with RLS policies
- **API Foundation** - RESTful API with OpenAPI spec
- **Web Application** - React SPA with Vite and TailwindCSS

### 🚧 Coming Soon
- **Kanban Board UI** - Drag-and-drop workflow for technique execution
- **Action/Validation UI** - Forms and detail views for execution tracking
- **Findings UI** - Interface for gap documentation
- **Heat Maps** - ATT&CK matrix visualization with coverage overlay
- **Defensive Tools Management** - CRUD for defensive tool catalog
- **Advanced Filtering** - Saved filters and advanced search across modules

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

## 📖 Demo Guide

This section provides a comprehensive walkthrough of PurpleKit's major features using the seeded demo data.

### 1. Authentication & Dashboard

**Login:**
1. Navigate to http://localhost:3000
2. Login as `admin@acme.com` / `demo123!`
3. View the dashboard showing engagement overview and recent activity

**What to explore:**
- Dashboard displays active engagements (Q4 2024 Purple Team Assessment)
- Recent activity feed shows engagement updates
- Quick stats show total engagements, techniques, and actions

### 2. Engagements Management

**View Engagements List:**
1. Click "Engagements" in sidebar
2. See list of purple team operations with status, dates, and progress

**Explore Engagement Details:**
1. Click on "Q4 2024 Purple Team Assessment" engagement
2. View engagement overview with:
   - Status, dates, methodology (Red Team, Purple Team, etc.)
   - Progress metrics (techniques, actions, detections, findings)
   - Techniques breakdown by tactic
3. Scroll to techniques table showing ATT&CK techniques with status

**Create New Engagement:**
1. Click "Create Engagement" button
2. Fill in name, description, methodology, dates
3. Set red/blue team leads
4. Click "Create" to save

**Clone Engagement Template:**
1. From engagement detail page, click "Clone as Template"
2. Edit name and dates
3. All techniques are copied for reusable playbooks

### 3. MITRE ATT&CK Techniques Browser

**Browse Techniques:**
1. Click "Techniques" in sidebar
2. See searchable catalog of 600+ ATT&CK techniques

**Search and Filter:**
1. Use search bar to find techniques (e.g., "credential dumping")
2. Filter by tactic (e.g., "Credential Access")
3. Filter by platform (e.g., "Windows", "Linux")
4. View results with technique ID, name, tactic, and platforms

**View Technique Details:**
1. Click on any technique (e.g., "T1003 - OS Credential Dumping")
2. View full description, tactics, platforms, data sources
3. See subtechniques listed (e.g., T1003.001 LSASS Memory)
4. Click "Add to Engagement" to associate with current engagement

### 4. User Management (Admin Only)

**View Users:**
1. Click "Users" in sidebar (only visible to admins)
2. See list of organization users with roles and status

**Invite New User:**
1. Click "Invite User" button
2. Enter email, display name, and select role
3. Click "Invite" - temporary password is logged to console
4. New user appears in list with "Active" status

**Edit User:**
1. Click "Edit" button next to any user
2. Modify display name or role
3. Save changes

**Deactivate User:**
1. Click "Edit" on a user
2. Click "Deactivate User"
3. Confirm action
4. User status changes to "Inactive"

**Business Rules:**
- Cannot change your own role
- Cannot deactivate yourself
- Cannot deactivate the last admin in organization

### 5. Settings/Configuration (Admin Only)

**View Settings:**
1. Click "Settings" in sidebar
2. See three sections: Profile, Reports, Security

**Profile Settings:**
1. View/edit timezone (e.g., America/New_York)
2. Set date format preference (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
3. Set time format (12-hour or 24-hour)

**Report Settings:**
1. Set default report type (Executive Summary, Technical, Compliance)
2. Set default export format (PDF or HTML)

**Security Settings:**
1. Configure session timeout duration
2. Set password policy requirements
3. Admin-only editing (other users see read-only view)

### 6. Analytics Dashboard

**View Analytics:**
1. Click "Analytics" in sidebar
2. See organization-wide metrics and charts

**Key Performance Indicators (Top Row):**
- **Total Engagements**: Count with active breakdown
- **Detection Rate**: Percentage of actions detected
- **Avg Time to Detect**: Mean response time in seconds
- **Critical Findings**: High-priority gaps identified

**Interactive Charts:**
1. **Engagements Over Time** (Line Chart): Track started, completed, active engagements
2. **Detection Rate by Tool** (Bar Chart): Compare effectiveness of defensive tools
3. **Findings by Pillar** (Donut Chart): People vs Process vs Technology gaps
4. **Response Times** (Grouped Bar): Compare TTD, TTI, TTC, TTR metrics
5. **Actions Over Time** (Area Chart): Activity timeline showing engagement intensity
6. **Findings by Severity** (Stacked Bar): Top 10 engagements with severity distribution

**Date Range Filtering:**
1. Use dropdown to select time range (Last 7/30/90/365 days)
2. All charts update dynamically
3. Default is last 90 days

### 7. Report Generation

**Generate Engagement Report:**
1. Navigate to an engagement detail page
2. Click "Generate Report" button
3. Select report type and format
4. Click "Generate"
5. Report is queued for async generation
6. Download link appears when ready

**Report Contents:**
- Executive summary with key metrics
- Complete technique coverage analysis
- Detection validation results
- Findings breakdown by severity and pillar
- Recommendations and next steps

### 8. Complete Workflow Example

**End-to-End Purple Team Operation:**

1. **Create Engagement** (Red Team Lead)
   - Create new engagement: "Web App Security Test"
   - Set methodology to "Purple Team"
   - Assign red/blue leads

2. **Add Techniques** (Red Team Lead)
   - Go to Techniques browser
   - Search for web app techniques
   - Add T1190 (Exploit Public-Facing Application)
   - Add T1059.007 (JavaScript for malicious code)
   - Techniques appear in engagement with "Planned" status

3. **Log Actions** (Red Team - API)
   - Use API to log attack execution:
   ```bash
   curl -X POST http://localhost:3001/api/v1/actions \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "techniqueId": "<technique-id>",
       "executedAt": "2024-12-01T10:00:00Z",
       "executedById": "<red-team-user-id>",
       "attackDetails": "Exploited SQL injection in login form",
       "command": "sqlmap -u http://target/login --dump",
       "targetSystem": "web-app-prod.example.com"
     }'
   ```

4. **Validate Detections** (Blue Team - API)
   - Blue team reviews logs and records detection:
   ```bash
   curl -X POST http://localhost:3001/api/v1/detection-validation \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "actionId": "<action-id>",
       "outcome": "ALERTED",
       "defensiveToolId": "<siem-tool-id>",
       "alertPriority": "HIGH",
       "timingMetrics": {
         "timeToDetect": 120
       }
     }'
   ```

5. **Document Findings** (Either Team - API)
   - Create finding for gaps discovered:
   ```bash
   curl -X POST http://localhost:3001/api/v1/findings \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "engagementId": "<engagement-id>",
       "title": "WAF not blocking SQL injection",
       "description": "Web Application Firewall failed to detect SQL injection attempts",
       "severity": "CRITICAL",
       "pillar": "TECHNOLOGY",
       "category": "Detection Gap",
       "affectedSystems": ["web-app-prod"],
       "recommendation": "Update WAF rules and enable strict SQL injection protection"
     }'
   ```

6. **View Analytics** (Leadership)
   - Navigate to Analytics dashboard
   - See detection rate for this engagement
   - Compare response times across tools
   - Review findings distribution

7. **Generate Report** (Red/Blue Lead)
   - Go to engagement detail page
   - Generate executive summary report
   - Download PDF for stakeholders
   - Share with management and compliance

### 9. API Exploration

**Using the API Directly:**

All endpoints require authentication. Get a token first:

```bash
# Login to get access token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "demo123!"
  }'

# Use token in subsequent requests
export TOKEN="<access-token-from-response>"

# List engagements
curl http://localhost:3001/api/v1/engagements \
  -H "Authorization: Bearer $TOKEN"

# Get analytics
curl http://localhost:3001/api/v1/analytics?startDate=2024-01-01T00:00:00Z \
  -H "Authorization: Bearer $TOKEN"
```

**API Health Check:**
```bash
curl http://localhost:3001/health
```

### 10. Role-Based Access Control Demo

**Test Different User Roles:**

1. **Admin** (`admin@acme.com`):
   - Full access to all features
   - Can manage users and settings
   - Can create/edit/delete all resources

2. **Red Team Lead** (`malcolm@acme.com`):
   - Can create and lead engagements
   - Can add techniques and log actions
   - Cannot manage users or settings

3. **Blue Team Lead** (`sarah@acme.com`):
   - Can validate detections
   - Can document findings
   - Cannot manage users or settings

4. **Analyst** (`mike@acme.com`):
   - Can view all engagements and analytics
   - Cannot create or edit engagements
   - Read-only access to most features

**Test Permission Boundaries:**
- Login as Analyst and try to create an engagement (should be blocked)
- Login as Red Lead and try to access Users page (should be hidden)
- Login as Blue Lead and try to edit settings (should see read-only view)

### 11. Troubleshooting Demo Issues

**If the web app doesn't load:**
```bash
cd purplekit/apps/web
npm run dev
```

**If API returns 500 errors:**
```bash
# Check API logs
cd purplekit/apps/api
npm run dev

# Check database connection
docker ps | grep postgres
```

**If no demo data appears:**
```bash
# Reseed the database
cd purplekit/packages/database
npm run db:seed
```

**Clear and reset everything:**
```bash
cd purplekit
npm run docker:down
docker volume prune -f
npm run docker:up
npm run db:reset
npm run db:seed
```

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
- [x] **Techniques UI** (Browser with search and filtering)
- [x] **ATT&CK API** (Browse, Search, Filter techniques)
- [x] **MITRE ATT&CK Browser Page** (Interactive technique exploration)

### Phase 2: Workflow ✅ APIs COMPLETE
- [x] **Actions API** (Red team execution logging)
- [x] **Validations API** (Blue team detection validation)
- [ ] Kanban Board UI
- [ ] Action/Validation UI

### Phase 3: Insights ✅ COMPLETE
- [x] **Findings API** (Gap documentation with PPT)
- [x] **Analytics API** (Organization-wide metrics aggregation)
- [x] **Analytics Dashboard** (6 charts, 4 KPI cards, date filtering)
- [ ] Findings UI (API complete, UI pending)
- [ ] Heat Map UI

### Phase 4: Reports & Management ✅ COMPLETE
- [x] **Report Generation** (PDF/HTML export with job queue)
- [x] **User Management** (Invite, edit, deactivate users)
- [x] **Settings/Configuration** (Org-wide preferences)
- [ ] Navigator Export (Future enhancement)

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

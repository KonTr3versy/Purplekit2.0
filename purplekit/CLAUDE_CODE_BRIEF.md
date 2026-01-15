# PurpleKit - Project Brief for Claude Code

## Overview

PurpleKit is a **Purple Team Operations Management Platform** - a web application that helps security teams coordinate red team attacks with blue team detection validation, track coverage against MITRE ATT&CK, and generate actionable reports.

## What's Already Built

The project scaffold is complete with:

### ✅ Fully Implemented
- **Database Schema** (`packages/database/prisma/schema.prisma`) - 17 Prisma models, all enums, relations, indexes
- **Seed Script** (`packages/database/prisma/seed.ts`) - Demo data for testing
- **RLS Policies** (`packages/database/prisma/rls-policies.sql`) - Multi-tenant security
- **API Foundation** - Express app, config, middleware (auth, errors, rate-limiting)
- **Auth Routes** (`apps/api/src/routes/auth.ts`) - Login, logout, refresh, me endpoints
- **Web App Shell** - React app with routing, layouts, sidebar, auth store
- **Login Page** - Functional login that connects to API

### ⚠️ Needs Implementation
- **11 API Route Handlers** - Currently stubs, need CRUD operations
- **React Pages** - Currently placeholders, need full UI
- **Real-time Updates** - WebSocket integration
- **Heat Map Visualization** - ATT&CK matrix view
- **Report Generation** - PDF/HTML reports

## Tech Stack

### Backend (apps/api)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Logging**: Pino

### Frontend (apps/web)
- **Framework**: React 18
- **Build**: Vite
- **Routing**: React Router v6
- **State**: Zustand (auth store exists)
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Infrastructure
- **Monorepo**: Turborepo + npm workspaces
- **Database**: PostgreSQL (Docker)
- **Cache**: Redis (Docker)
- **Object Storage**: MinIO/S3 (Docker)
- **Email**: Mailhog for dev (Docker)

## Key Files to Reference

| File | Purpose |
|------|---------|
| `OPENAPI.yaml` | Complete API specification - **USE THIS AS THE CONTRACT** |
| `packages/database/prisma/schema.prisma` | Database models and relations |
| `apps/api/src/routes/auth.ts` | Example of a complete route implementation |
| `apps/api/src/middleware/auth.ts` | Authentication middleware pattern |
| `apps/web/src/stores/auth.ts` | Zustand store pattern |
| `apps/web/src/pages/auth/LoginPage.tsx` | Example React page with API call |

## Database Schema Summary

### Core Entities
```
Organization (tenant root)
├── User (with roles: ADMIN, RED_LEAD, BLUE_LEAD, ANALYST, OBSERVER)
├── Engagement (purple team operation)
│   ├── EngagementTechnique (ATT&CK techniques in this engagement)
│   │   ├── TechniqueDependency (for scenario mode)
│   │   └── Action (red team execution log)
│   │       ├── DetectionValidation (blue team validation)
│   │       └── TimingMetrics (TTD, TTI, TTC, TTR)
│   └── Finding (documented gaps)
├── DefensiveTool (security tools tracked)
├── ReportJob (async report generation)
└── AuditLog (compliance logging)

AttackTechnique (MITRE ATT&CK reference data - shared across tenants)
```

### Key Enums
- **TechniqueStatus**: PLANNED → BLOCKED → EXECUTING → VALIDATING → COMPLETE
- **DetectionOutcome**: LOGGED, ALERTED, PREVENTED, NOT_LOGGED
- **FindingPillar**: PEOPLE, PROCESS, TECHNOLOGY
- **Methodology**: ATOMIC (isolated tests), SCENARIO (attack chains)

## Implementation Priority

### Phase 1: Core CRUD (Start Here)
1. **Engagements API** (`apps/api/src/routes/engagements.ts`)
   - GET /engagements - List with pagination, filtering
   - POST /engagements - Create new
   - GET /engagements/:id - Get details
   - PATCH /engagements/:id - Update
   - DELETE /engagements/:id - Archive

2. **Engagements UI** (`apps/web/src/pages/engagements/`)
   - EngagementsPage - List view with table
   - EngagementDetailPage - Detail view with tabs

3. **Techniques API** (`apps/api/src/routes/techniques.ts`)
   - Endpoint to add/remove techniques from engagement
   - Bulk add techniques
   - Update technique status

### Phase 2: Workflow
4. **Kanban Board UI** - Drag-and-drop for technique status
5. **Actions API** - Log red team executions
6. **Validations API** - Blue team validation forms
7. **Action/Validation UI** - Forms and detail views

### Phase 3: Insights
8. **Findings API & UI** - Gap documentation
9. **Analytics API** - Dashboard stats, timing metrics
10. **Heat Map UI** - ATT&CK matrix visualization

### Phase 4: Reports
11. **Report Generation** - Async PDF/HTML generation
12. **Navigator Export** - ATT&CK Navigator JSON

## API Patterns to Follow

### Route Handler Pattern (see auth.ts for example)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authenticate, requireAnalyst } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error';

export const engagementsRouter = Router();
engagementsRouter.use(authenticate);

// Validation schema
const createEngagementSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  methodology: z.enum(['ATOMIC', 'SCENARIO']),
  visibilityMode: z.enum(['OPEN', 'BLIND_BLUE', 'BLIND_RED']).default('OPEN'),
});

// GET /engagements
engagementsRouter.get('/', requireAnalyst, async (req, res, next) => {
  try {
    const { status, methodology, limit = 20, cursor } = req.query;
    
    const engagements = await prisma.engagement.findMany({
      where: {
        orgId: req.user!.orgId,
        ...(status && { status: status as any }),
        ...(methodology && { methodology: methodology as any }),
      },
      take: Number(limit) + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, displayName: true, email: true } },
        _count: { select: { techniques: true } },
      },
    });

    const hasMore = engagements.length > Number(limit);
    if (hasMore) engagements.pop();

    res.json({
      data: engagements,
      meta: {
        limit: Number(limit),
        cursor: hasMore ? engagements[engagements.length - 1]?.id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /engagements
engagementsRouter.post('/', requireAnalyst, async (req, res, next) => {
  try {
    const body = createEngagementSchema.parse(req.body);
    
    const engagement = await prisma.engagement.create({
      data: {
        ...body,
        orgId: req.user!.orgId,
        createdById: req.user!.id,
      },
    });

    res.status(201).json(engagement);
  } catch (error) {
    next(error);
  }
});
```

### React Page Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function EngagementsPage() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => api.get('/engagements').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/engagements', data),
    onSuccess: () => queryClient.invalidateQueries(['engagements']),
  });

  // ... render UI
}
```

### API Client Setup (create apps/web/src/lib/api.ts)
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token or logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

## UI Components to Build

### Priority Components
1. **DataTable** - Sortable, filterable table with pagination
2. **Modal** - Reusable modal dialog
3. **Form components** - Input, Select, Textarea with error states
4. **Badge** - Status badges (already have CSS classes)
5. **EmptyState** - For lists with no data
6. **LoadingSpinner** - Loading states

### Page-Specific Components
1. **KanbanBoard** - Drag-and-drop columns for technique status
2. **TechniqueCard** - Card for kanban board
3. **HeatMap** - ATT&CK matrix grid
4. **TimingChart** - TTD/TTI/TTC/TTR visualization
5. **FindingForm** - Create/edit finding with PPT categorization

## Testing the Setup

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start dev servers
npm run dev

# Test login
# Email: malcolm@acme.com
# Password: demo123!
```

## Commands Reference

```bash
npm run dev           # Start all apps
npm run build         # Build all apps
npm run db:studio     # Open Prisma Studio (view data)
npm run db:seed       # Re-seed demo data
docker-compose logs   # View Docker logs
```

## Questions to Ask If Stuck

1. "How should I structure the [X] API endpoint?" → Reference OPENAPI.yaml
2. "What fields does [entity] have?" → Reference schema.prisma
3. "How do I handle auth?" → Reference middleware/auth.ts
4. "What's the React pattern?" → Reference LoginPage.tsx and auth store

## Success Criteria

The app is complete when a user can:
1. ✅ Login/logout (already works)
2. Create and manage engagements
3. Add ATT&CK techniques to engagements
4. Move techniques through workflow (Kanban)
5. Log red team actions with evidence
6. Validate detections (blue team)
7. Record timing metrics
8. Document findings with PPT categorization
9. View analytics dashboard
10. Generate reports

Good luck! The scaffold handles all the boring setup - now you get to build the interesting parts.

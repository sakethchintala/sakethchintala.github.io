# Architecture Documentation

## System Overview

This document provides an in-depth look at the architectural decisions and patterns used in the SaaS Admin & Insights Platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React 18 + TypeScript + TailwindCSS + TanStack Query      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JSON)
                      │ JWT Authentication
┌─────────────────────▼───────────────────────────────────────┐
│                      Backend API Layer                       │
│       Node.js + Express + TypeScript + Middleware           │
├──────────────────────┬───────────────────────────────────────┤
│   Controllers        │   Services                            │
│   - Auth             │   - AuthService                       │
│   - Users            │   - AIService (OpenAI)                │
│   - Analytics        │   - AnalyticsService                  │
│   - AI Insights      │   - AuditService                      │
│   - Audit Logs       │   - TenantService                     │
└──────────────────────┴────────────┬──────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
┌───────────▼─────────┐  ┌─────────▼────────┐  ┌──────────▼────────┐
│    PostgreSQL       │  │     MongoDB      │  │       Redis       │
│   (Relational)      │  │  (Documents)     │  │      (Cache)      │
├─────────────────────┤  ├──────────────────┤  ├───────────────────┤
│ - Users             │  │ - Usage Metrics  │  │ - Sessions        │
│ - Tenants           │  │ - Activity Logs  │  │ - Rate Limiting   │
│ - Permissions       │  │ - AI Insights    │  │ - Token Blacklist │
│ - Audit Logs        │  │ - Time-series    │  │                   │
│ - API Keys          │  │                  │  │                   │
└─────────────────────┘  └──────────────────┘  └───────────────────┘
```

## Multi-Tenancy Architecture

### Shared Database, Row-Level Isolation

We use a **shared database with row-level tenant isolation** pattern:

**Pros:**
- Cost-effective (single database instance)
- Easy to manage and backup
- Efficient resource utilization
- Simple schema migrations (apply once to all tenants)

**Cons:**
- Requires strict query filtering
- Potential security risk if tenant_id filtering is missed
- Performance impact as tenant count grows

**Implementation:**
```sql
-- Every table has tenant_id
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  -- Composite unique constraint
  UNIQUE(tenant_id, email)
);

-- Row-Level Security (RLS) enforces isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Security Layers:**
1. **Application Layer:** Every query includes `WHERE tenant_id = ?`
2. **Database Layer:** Prisma/ORM automatically adds tenant filter
3. **PostgreSQL RLS:** Database-level enforcement as final safety net

### Alternative Patterns Considered

#### 1. Separate Database Per Tenant
**When to use:** Very large enterprise customers, strict compliance requirements

**Pros:**
- Complete isolation
- Custom configurations per tenant
- Easier to scale individual tenants

**Cons:**
- High operational overhead
- Expensive (connection pools per database)
- Complex migrations (apply to N databases)

#### 2. Separate Schema Per Tenant
**When to use:** Medium-sized customers, PostgreSQL-specific deployments

**Pros:**
- Good isolation within single database
- Easier backups per tenant

**Cons:**
- Connection pool management complexity
- Schema migration still challenging
- Limited scalability (PostgreSQL limit ~100 schemas)

## Data Model Design Decisions

### 1. User Authentication Flow

```
┌──────────┐    1. Login (email/password)      ┌──────────┐
│  Client  │──────────────────────────────────>│  Backend │
└──────────┘                                    └──────────┘
     │                                               │
     │    2. Validate credentials (bcrypt)          │
     │    3. Generate JWT tokens                    │
     │       - Access token (15 min)                │
     │       - Refresh token (7 days)               │
     │    4. Store refresh token in DB              │
     │    5. Set httpOnly cookie                    │
     │<─────────────────────────────────────────────┤
     │                                               │
     │    6. API requests (Authorization header)    │
     │──────────────────────────────────────────────>│
     │                                               │
     │    7. Token expired (401)                    │
     │<─────────────────────────────────────────────┤
     │                                               │
     │    8. Refresh token (from cookie)            │
     │──────────────────────────────────────────────>│
     │    9. Issue new tokens + rotate refresh      │
     │<─────────────────────────────────────────────┤
```

**Why JWT + Refresh Token Rotation?**

- **Short-lived access tokens** (15 min) limit exposure
- **Refresh token rotation** prevents reuse attacks
- **Database storage** enables instant revocation
- **httpOnly cookies** protect against XSS

### 2. Audit Trail Design

Every action is logged with:
```typescript
{
  tenantId: string,      // Tenant context
  userId: string,         // Actor
  action: AuditAction,    // CREATE, UPDATE, DELETE, LOGIN, etc.
  resource: string,       // Entity type (User, Tenant, etc.)
  resourceId: string,     // Specific entity ID
  description: string,    // Human-readable description
  metadata: JSON,         // Before/after state
  ipAddress: string,
  userAgent: string,
  timestamp: DateTime
}
```

**Why PostgreSQL for Audit Logs?**
- ACID compliance for immutability
- Efficient indexed queries
- Strong consistency guarantees

**Why not MongoDB?**
- Could work for high-volume logs
- Trade-off: eventual consistency
- We prioritize integrity over volume

### 3. AI Insights Storage

Stored in **MongoDB** because:
- Flexible schema (insights evolve over time)
- High write volume (generated frequently)
- TTL indexes (auto-expire old insights)
- Embedded metadata (no joins needed)

```javascript
{
  _id: ObjectId,
  tenantId: UUID,
  type: "anomaly" | "recommendation" | "prediction",
  severity: "low" | "medium" | "high" | "critical",
  title: String,
  description: String,
  recommendation: String,
  confidence: Number,
  metadata: Object,  // Flexible structure
  createdAt: Date,
  expiresAt: Date,   // TTL index
  dismissed: Boolean
}
```

## AI Integration Architecture

### Grounded AI Pattern

**Problem:** Generic AI responses are not actionable

**Solution:** Ground AI in platform data

```typescript
// 1. Collect context from database
const context = {
  tenant: { name, plan, industry },
  metrics: { users, apiCalls, storage, errors },
  trends: { growthRate, usagePattern },
  issues: { failedLogins, slowQueries }
};

// 2. Structured prompt
const prompt = `
Analyze these SaaS metrics:
${JSON.stringify(context)}

Provide insights in this format:
[
  {
    type: "anomaly",
    severity: "high",
    title: "...",
    description: "...",
    recommendation: "...",
    impact: "...",
    confidence: 0.87
  }
]
`;

// 3. OpenAI generates structured response
const completion = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ],
  temperature: 0.7
});

// 4. Parse and validate
const insights = parseInsights(completion.choices[0].message.content);

// 5. Store for display
await storeInsights(insights);
```

**Key Principles:**
1. **No hallucinations:** All data comes from database
2. **Structured output:** JSON format for consistency
3. **Confidence scores:** Let users evaluate reliability
4. **Actionable:** Every insight has a recommendation
5. **Time-bound:** Insights expire (7 days) to stay relevant

### Fallback Mechanism

If OpenAI fails or API key is missing:
```typescript
function generateFallbackInsights(context) {
  // Rule-based insights
  const insights = [];
  
  if (context.metrics.errorRate > 0.05) {
    insights.push({
      type: "alert",
      severity: "high",
      title: "High Error Rate Detected",
      description: `Error rate is ${errorRate}%, above 5% threshold`,
      recommendation: "Review recent deployments and error logs",
      confidence: 0.95
    });
  }
  
  // More rule-based checks...
  return insights;
}
```

## Security Architecture

### Defense in Depth

1. **Input Validation**
   - Zod schemas validate all inputs
   - Type safety via TypeScript
   - SQL injection prevented by Prisma ORM

2. **Authentication**
   - bcrypt with 12 rounds
   - JWT with short expiration
   - Refresh token rotation
   - Rate limiting (5 attempts / 15 min)

3. **Authorization**
   - Role-based access control (RBAC)
   - Tenant isolation checks
   - Middleware enforces permissions

4. **Data Protection**
   - Passwords hashed (never stored plaintext)
   - Sensitive data encrypted at rest
   - TLS in production
   - Secrets in environment variables

5. **Rate Limiting**
   - Global: 100 req/hr (free tier)
   - Auth endpoints: 5 attempts/15 min
   - Redis-backed sliding window

6. **Audit Logging**
   - All actions logged
   - Immutable audit trail
   - Failed login tracking

### OWASP Top 10 Coverage

| Risk | Mitigation |
|------|-----------|
| A01: Broken Access Control | RBAC + tenant checks on every query |
| A02: Cryptographic Failures | TLS, bcrypt, secure tokens |
| A03: Injection | Parameterized queries (Prisma) |
| A04: Insecure Design | Threat modeling, security-first |
| A05: Security Misconfiguration | Helmet.js, secure defaults |
| A06: Vulnerable Components | npm audit, Snyk |
| A07: Authentication Failures | MFA-ready, rate limiting |
| A08: Software Integrity | Package checksums |
| A09: Logging Failures | Comprehensive audit trail |
| A10: SSRF | URL validation, network segmentation |

## Scalability Patterns

### Horizontal Scaling

```
                 ┌──────────────┐
                 │   Route 53   │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │      ALB     │
                 └──────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐     ┌───▼────┐     ┌───▼────┐
   │ Server 1│     │Server 2│     │Server 3│
   └────┬────┘     └───┬────┘     └───┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
              ┌────────▼────────┐
              │  Aurora Cluster │
              │  (Multi-AZ)     │
              └─────────────────┘
```

**Stateless Servers:**
- No session state on servers
- JWT self-contained
- Redis for shared cache

**Database:**
- Read replicas for scaling reads
- Connection pooling (PgBouncer)
- Partitioning by tenant_id for large tables

### Caching Strategy

```typescript
// L1: Application memory (1 minute)
const cache = new Map();

// L2: Redis (1 hour)
const redis = getRedisClient();

// L3: Database
async function getAnalytics(tenantId) {
  // Check L1
  const cached = cache.get(tenantId);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  // Check L2
  const redisCached = await redis.get(`analytics:${tenantId}`);
  if (redisCached) {
    return JSON.parse(redisCached);
  }
  
  // Query L3
  const data = await database.query(/* ... */);
  
  // Store in caches
  await redis.setEx(`analytics:${tenantId}`, 3600, JSON.stringify(data));
  cache.set(tenantId, { data, expires: Date.now() + 60000 });
  
  return data;
}
```

## Monitoring & Observability

### Three Pillars

1. **Metrics** (What's happening?)
   - Request rate, error rate, latency
   - Database query time
   - Cache hit rate
   - Business metrics (new tenants, active users)

2. **Logs** (What went wrong?)
   - Structured JSON logs
   - Correlation IDs for request tracing
   - Log levels (DEBUG, INFO, WARN, ERROR)
   - Centralized aggregation (ELK stack)

3. **Traces** (Where's the bottleneck?)
   - Distributed tracing (AWS X-Ray / Jaeger)
   - End-to-end request flow
   - Performance hotspot identification

### Health Checks

```typescript
// /health endpoint
{
  status: "healthy",
  timestamp: "2026-02-02T10:30:00Z",
  checks: {
    database: "ok",
    mongodb: "ok",
    redis: "ok",
    openai: "ok"
  },
  uptime: 86400
}
```

## Deployment Strategy

### Blue-Green Deployment

```
┌─────────────┐
│     ALB     │
└──────┬──────┘
       │
   ┌───▼─────────────┐
   │   Target Group  │
   └───┬─────────────┘
       │
   ┌───▼──────────┐
   │ Blue (v1.0)  │  ← Current production
   │ 3 instances  │
   └──────────────┘

   ┌──────────────┐
   │ Green (v1.1) │  ← New version
   │ 3 instances  │
   └──────────────┘
```

**Process:**
1. Deploy v1.1 to Green environment
2. Run smoke tests
3. Switch ALB target to Green
4. Monitor for 10 minutes
5. If issues: instant rollback to Blue
6. If success: decommission Blue

### Database Migrations

**Backward Compatible Changes:**
```sql
-- Step 1: Add column (nullable)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Deploy code that uses phone (optional)

-- Step 2: Backfill data
UPDATE users SET phone = '...' WHERE ...;

-- Step 3: Make non-nullable (next deployment)
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

## Performance Optimization

### Database Optimization

1. **Indexes**
   ```sql
   -- Query: WHERE tenant_id = ? AND status = 'ACTIVE'
   CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
   
   -- Query: ORDER BY created_at DESC
   CREATE INDEX idx_users_created_at ON users(created_at DESC);
   ```

2. **Query Optimization**
   - Use `EXPLAIN ANALYZE` to find slow queries
   - Avoid N+1 queries (use `include` in Prisma)
   - Limit result sets (pagination)

3. **Connection Pooling**
   - Prisma default: 10 connections
   - Production: 20-50 per instance
   - PgBouncer for pooling across instances

### API Response Time

**Target SLAs:**
- p50: < 200ms
- p95: < 500ms
- p99: < 1000ms

**Optimization Techniques:**
1. Database query optimization
2. Redis caching for frequent reads
3. GraphQL DataLoader for batching
4. Gzip compression
5. CDN for static assets

## Disaster Recovery

### Backup Strategy

**PostgreSQL:**
- Automated snapshots every 6 hours
- Point-in-time recovery (PITR)
- 30-day retention
- Cross-region replication

**MongoDB:**
- Daily snapshots
- 30-day retention
- Replica set with 3 nodes

### RTO & RPO

- **Recovery Time Objective (RTO):** < 1 hour
- **Recovery Point Objective (RPO):** < 5 minutes

### Incident Response

1. **Detection:** Automated alerts (PagerDuty)
2. **Escalation:** On-call engineer paged
3. **Communication:** Status page updated
4. **Resolution:** Follow runbook procedures
5. **Post-mortem:** Root cause analysis within 48 hours

---

**Last Updated:** February 2, 2026

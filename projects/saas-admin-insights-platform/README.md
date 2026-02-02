# SaaS Admin & Insights Platform

A production-grade, multi-tenant SaaS administration platform with AI-powered insights and analytics. Built to demonstrate enterprise-level architecture, security best practices, and intelligent automation.

## 🎯 Overview

This platform enables organizations to manage users, roles, permissions, and operational metrics across multiple tenants with AI-assisted decision-making. It showcases real-world architectural patterns used in modern SaaS applications at companies like Salesforce, HubSpot, and Atlassian.

### Key Features

- **Multi-Tenant Architecture**: Complete tenant isolation with shared infrastructure
- **AI-Powered Insights**: OpenAI integration for intelligent analytics and recommendations
- **Role-Based Access Control (RBAC)**: Fine-grained permissions system
- **Real-Time Analytics**: Live usage metrics and operational dashboards
- **Audit Trail**: Complete activity logging for compliance and security
- **REST & GraphQL APIs**: Dual API layer for flexibility
- **Production Security**: JWT auth, rate limiting, input validation, SQL injection prevention
- **Scalable Design**: Horizontal scaling patterns with database partitioning

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and optimized builds
- **TanStack Query (React Query)** for server state management
- **Zustand** for client state management
- **Recharts** for data visualization
- **TailwindCSS** for utility-first styling
- **React Router v6** for navigation

#### Backend
- **Node.js 20+** with Express.js
- **TypeScript** for type safety across the stack
- **PostgreSQL** for relational data (users, tenants, permissions)
- **MongoDB** for logs, metrics, and time-series data
- **Redis** for caching and session management
- **Prisma ORM** for type-safe database access
- **OpenAI API** for AI-powered insights

#### Security & Authentication
- **JWT** with refresh token rotation
- **bcrypt** for password hashing
- **helmet** for HTTP header security
- **rate-limit** for DDoS protection
- **CORS** with strict origin policies
- **SQL injection prevention** via parameterized queries

### System Design Decisions

#### 1. Multi-Tenancy Pattern: Row-Level Tenant Isolation

**Decision**: Use shared database with tenant_id column approach (vs. separate databases per tenant)

**Rationale**:
- **Cost Efficiency**: Shared infrastructure reduces operational overhead
- **Scalability**: Easier to manage 1000s of tenants without database sprawl
- **Maintenance**: Schema migrations apply to all tenants simultaneously
- **Performance**: Connection pooling is more efficient
- **Tradeoff**: Requires strict query filtering and security checks

**Implementation**:
```sql
-- Every table includes tenant_id
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  -- Add tenant_id to all indexes
  UNIQUE(tenant_id, email)
);

-- Enforce Row-Level Security (RLS) at database level
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### 2. Database Choice: PostgreSQL + MongoDB Hybrid

**PostgreSQL** for:
- Transactional data (users, tenants, permissions)
- ACID compliance requirements
- Complex relationships and joins
- Strong consistency guarantees

**MongoDB** for:
- Activity logs (high write volume)
- Usage metrics (time-series data)
- AI insights cache (flexible schema)
- Audit trail (append-only data)

**Rationale**: 
- Relational data benefits from ACID and joins
- Logs/metrics benefit from MongoDB's write performance and flexible schema
- Modern applications use polyglot persistence for optimal performance

#### 3. AI Integration Pattern: Grounded Intelligence

**Decision**: AI provides insights based on actual platform data, not generative responses

**Implementation**:
```typescript
// AI gets structured context from database
const context = {
  tenant: { id, name, industry, size },
  metrics: { activeUsers, dailyApiCalls, storageUsed },
  trends: { userGrowthRate, apiUsagePattern },
  issues: { failedLogins, slowQueries, errorRate }
};

// AI analyzes and provides actionable insights
const insights = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: [
    { role: "system", content: "You are a SaaS operations analyst..." },
    { role: "user", content: JSON.stringify(context) }
  ]
});
```

**Rationale**:
- Prevents AI hallucination by grounding responses in real data
- Provides actionable recommendations, not generic advice
- Augments decision-making rather than replacing it

#### 4. Authentication: JWT with Refresh Token Rotation

**Flow**:
1. Login → Issue access token (15min) + refresh token (7 days)
2. Access token expires → Use refresh token to get new pair
3. Refresh token used → Invalidate old token, issue new pair (rotation)
4. Logout → Blacklist refresh token in Redis

**Security Benefits**:
- Short-lived access tokens limit exposure
- Refresh token rotation prevents reuse attacks
- Redis blacklist provides instant revocation
- XSS protection via httpOnly cookies for refresh tokens

#### 5. API Rate Limiting Strategy

**Tiered Limits**:
- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: 10,000 requests/hour

**Implementation**:
```typescript
// Redis-backed sliding window counter
const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req) => {
    const tenant = await getTenant(req.user.tenantId);
    return RATE_LIMITS[tenant.plan];
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- MongoDB 6+
- Redis 7+
- OpenAI API key

### Installation

1. **Clone and navigate to project**:
```bash
cd projects/saas-admin-insights-platform
```

2. **Install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Configuration**:

Create `backend/.env`:
```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_platform
MONGODB_URI=mongodb://localhost:27017/saas_platform
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

4. **Database Setup**:
```bash
cd backend

# Run PostgreSQL migrations
npx prisma migrate dev

# Seed initial data
npm run seed

# Verify MongoDB connection
npm run db:check
```

5. **Start Development Servers**:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the Application**:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- API Docs: http://localhost:3000/api-docs

### Default Credentials

**Super Admin**:
- Email: `admin@platform.local`
- Password: `Admin123!`

**Demo Tenant Admin**:
- Email: `demo@acmecorp.com`
- Password: `Demo123!`

## 📊 Features Deep Dive

### 1. Multi-Tenant User Management

- **Tenant Creation**: Automated provisioning with default roles
- **User Invitation**: Email-based invite system with secure tokens
- **Role Management**: Hierarchical roles (Super Admin > Tenant Admin > User)
- **Permission System**: Granular permissions (read, write, delete, admin)

### 2. AI-Powered Insights Engine

The platform uses OpenAI GPT-4 to analyze tenant data and provide:

- **Usage Anomaly Detection**: Identify unusual patterns (traffic spikes, error surges)
- **Cost Optimization**: Recommend resource allocation improvements
- **Security Alerts**: Detect suspicious login patterns
- **Performance Tips**: Suggest query optimizations and caching strategies
- **Predictive Analytics**: Forecast growth and resource needs

**Example AI Insight**:
```json
{
  "type": "anomaly_detected",
  "severity": "warning",
  "title": "Unusual API Traffic Spike",
  "description": "API calls increased 300% in the last 24 hours...",
  "recommendation": "Consider upgrading to Pro tier or optimizing batch requests",
  "impact": "high",
  "confidence": 0.87
}
```

### 3. Real-Time Analytics Dashboard

- **Active Users**: Real-time connected user count
- **API Usage**: Request volume, response times, error rates
- **Storage Metrics**: Database size, file storage, growth trends
- **Performance**: Query latency, cache hit rates
- **Cost Tracking**: Usage-based billing calculations

### 4. Audit Trail & Compliance

Every action is logged with:
- Actor (user who performed action)
- Action type (create, update, delete, login)
- Resource (affected entity)
- Timestamp (UTC with millisecond precision)
- IP address and user agent
- Before/after state for data changes

### 5. Advanced Search & Filtering

- **Full-text search** across users, logs, and metrics
- **Date range filtering** with presets (today, last 7 days, last 30 days)
- **Multi-criteria filtering** (role, status, tenant)
- **Export capabilities** (CSV, JSON)

## 🔒 Security Features

### Defense in Depth

1. **Input Validation**: Zod schemas validate all incoming data
2. **SQL Injection Prevention**: Prisma ORM with parameterized queries
3. **XSS Protection**: React's built-in escaping + Content Security Policy
4. **CSRF Protection**: SameSite cookies + token validation
5. **Rate Limiting**: Prevent brute force and DDoS attacks
6. **Password Security**: bcrypt with 12 rounds + password strength requirements
7. **Session Management**: JWT with short expiration + refresh token rotation
8. **HTTPS Enforcement**: Redirect all HTTP to HTTPS in production
9. **Security Headers**: helmet.js for X-Frame-Options, CSP, etc.
10. **Dependency Scanning**: npm audit + Snyk integration

### OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|---------------|------------|
| Broken Access Control | RBAC + tenant isolation checks on every query |
| Cryptographic Failures | TLS 1.3, bcrypt, secure random tokens |
| Injection | Parameterized queries, input validation |
| Insecure Design | Threat modeling, security-first architecture |
| Security Misconfiguration | Helmet.js, secure defaults |
| Vulnerable Components | Regular dependency updates |
| Authentication Failures | MFA ready, password policies, rate limiting |
| Software Integrity | Checksums, signed packages |
| Logging Failures | Comprehensive audit trail |
| SSRF | URL validation, network segmentation |

## 🏭 Production Deployment

### AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              CloudFront (CDN + WAF)                     │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌─────────▼────────┐
│  S3 (Frontend)  │    │  ALB (Backend)   │
└─────────────────┘    └─────────┬────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
         ┌────────▼────────┐         ┌─────────▼────────┐
         │  ECS Fargate    │         │  ECS Fargate     │
         │  (API Servers)  │         │  (API Servers)   │
         └────────┬────────┘         └─────────┬────────┘
                  │                             │
         ┌────────┴─────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
┌────────▼───────┐ ┌───▼────┐ ┌───────▼──────┐ ┌────▼─────┐
│  RDS Aurora    │ │ ElastiCache│ DocumentDB  │ │   S3     │
│ (PostgreSQL)   │ │  (Redis)   │ (MongoDB)   │ │ (Files)  │
└────────────────┘ └───────────┘ └─────────────┘ └──────────┘
```

### Infrastructure as Code (Terraform)

```hcl
# Example: ECS Fargate Service
resource "aws_ecs_service" "api" {
  name            = "saas-platform-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.api.id]
  }

  # Auto-scaling based on CPU and memory
  depends_on = [aws_lb_listener.api]
}
```

### Environment-Specific Configuration

| Environment | Infrastructure | Database | Scaling |
|-------------|---------------|----------|---------|
| **Development** | Local Docker | PostgreSQL + MongoDB local | N/A |
| **Staging** | ECS Fargate (2 tasks) | RDS Multi-AZ + DocumentDB | Manual |
| **Production** | ECS Fargate (min 3 tasks) | Aurora Global + DocumentDB cluster | Auto-scaling |

### Deployment Strategy

1. **Blue-Green Deployment**: Zero-downtime releases
2. **Database Migrations**: Backward-compatible changes first
3. **Feature Flags**: Gradual rollout of new features
4. **Health Checks**: ALB monitors `/health` endpoint
5. **Rollback Plan**: Previous task definition ready to activate

## 📈 Monitoring & Observability

### Metrics (CloudWatch + Prometheus)

- **Application Metrics**: Request rate, error rate, latency (p50, p95, p99)
- **Business Metrics**: New tenants, active users, API usage
- **Infrastructure Metrics**: CPU, memory, network I/O

### Logging (CloudWatch Logs + ELK)

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR with appropriate routing
- **Log Retention**: 30 days in CloudWatch, 90 days in S3

### Alerting (PagerDuty + Slack)

- **P0 (Critical)**: Database down, authentication failures > 10%
- **P1 (High)**: API error rate > 5%, latency > 2s
- **P2 (Medium)**: Disk usage > 80%, memory > 85%
- **P3 (Low)**: Slow queries, unused indexes

### Tracing (AWS X-Ray / Jaeger)

- Distributed tracing across microservices
- Request flow visualization
- Performance bottleneck identification

## 🧪 Testing Strategy

### Test Pyramid

```
       ┌─────────────┐
       │  E2E Tests  │  10% - Critical user flows
       └─────────────┘
      ┌───────────────┐
      │ Integration   │  20% - API + database
      └───────────────┘
    ┌──────────────────┐
    │   Unit Tests     │  70% - Business logic
    └──────────────────┘
```

### Coverage Requirements

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical paths (login, user creation, AI insights)

### Running Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# Backend coverage report
npm run test:coverage

# Frontend unit tests
cd frontend
npm test

# E2E tests (Playwright)
npm run test:e2e
```

## 📚 API Documentation

### REST API Endpoints

#### Authentication
```http
POST   /api/auth/register          # Create new tenant + admin user
POST   /api/auth/login             # Authenticate user
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Invalidate session
POST   /api/auth/forgot-password   # Send reset email
POST   /api/auth/reset-password    # Reset with token
```

#### Users
```http
GET    /api/users                  # List users (filtered by tenant)
POST   /api/users                  # Create new user
GET    /api/users/:id              # Get user details
PATCH  /api/users/:id              # Update user
DELETE /api/users/:id              # Soft delete user
POST   /api/users/:id/invite       # Send invitation email
```

#### Tenants (Super Admin only)
```http
GET    /api/tenants                # List all tenants
POST   /api/tenants                # Create tenant
GET    /api/tenants/:id            # Get tenant details
PATCH  /api/tenants/:id            # Update tenant
DELETE /api/tenants/:id            # Delete tenant
GET    /api/tenants/:id/stats      # Tenant usage statistics
```

#### Analytics
```http
GET    /api/analytics/overview     # Dashboard summary
GET    /api/analytics/usage        # API usage metrics
GET    /api/analytics/users        # User activity
GET    /api/analytics/performance  # System performance
POST   /api/analytics/export       # Export data (CSV/JSON)
```

#### AI Insights
```http
GET    /api/ai/insights            # Get AI-generated insights
POST   /api/ai/analyze             # Request custom analysis
GET    /api/ai/recommendations     # Get recommendations
POST   /api/ai/chat                # AI assistant chat
```

#### Audit Logs
```http
GET    /api/audit                  # Get audit trail
GET    /api/audit/:id              # Get log details
POST   /api/audit/search           # Advanced search
```

### GraphQL API

```graphql
type Query {
  me: User!
  users(filter: UserFilter): [User!]!
  tenant: Tenant!
  analytics(period: Period!): Analytics!
  aiInsights: [Insight!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  requestAIAnalysis(context: String!): Insight!
}

type Subscription {
  userActivity: UserEvent!
  newInsight: Insight!
}
```

## 🎨 Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/           # Login, register, forgot password
│   ├── dashboard/      # Main dashboard widgets
│   ├── users/          # User management tables, forms
│   ├── analytics/      # Charts, metrics, reports
│   ├── ai-insights/    # AI insight cards, chat interface
│   └── common/         # Reusable UI components
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── services/           # API client, auth service
├── contexts/           # React contexts (auth, theme)
├── types/              # TypeScript interfaces
└── utils/              # Helper functions
```

### State Management Philosophy

- **Server State**: TanStack Query for API data (caching, revalidation)
- **Client State**: Zustand for UI state (theme, sidebar, modals)
- **Form State**: React Hook Form for form validation
- **URL State**: React Router for navigation state

### Performance Optimizations

1. **Code Splitting**: Lazy load routes with `React.lazy()`
2. **Virtual Scrolling**: `react-virtual` for large lists
3. **Memoization**: `React.memo()` for expensive components
4. **Debouncing**: Search input with 300ms debounce
5. **Image Optimization**: WebP format, lazy loading
6. **Bundle Size**: Tree shaking, dynamic imports

## 🔄 Data Flow & State Management

### Request Lifecycle

```
User Action
    ↓
React Component
    ↓
TanStack Query Hook
    ↓
API Service (axios)
    ↓
JWT Interceptor (add auth header)
    ↓
Backend Route Handler
    ↓
Middleware (auth, validation, rate limit)
    ↓
Controller
    ↓
Service Layer (business logic)
    ↓
Database (Prisma/MongoDB)
    ↓
Response with data
    ↓
TanStack Query Cache Update
    ↓
React Re-render
```

### Authentication Flow

```
1. User submits login form
2. Frontend sends POST /api/auth/login
3. Backend validates credentials
4. Backend generates JWT access + refresh tokens
5. Tokens stored: Access (memory), Refresh (httpOnly cookie)
6. Frontend redirects to dashboard
7. All subsequent requests include Authorization: Bearer {token}
8. When access token expires (15min):
   - Axios interceptor catches 401
   - Automatically calls /api/auth/refresh
   - Retries original request with new token
9. If refresh fails → Logout user
```

## 🛠️ Development Practices

### Code Quality

- **ESLint + Prettier**: Consistent code formatting
- **TypeScript Strict Mode**: Catch errors at compile time
- **Husky Git Hooks**: Pre-commit linting, pre-push tests
- **Conventional Commits**: Structured commit messages
- **Code Reviews**: Required for all PRs

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Production emergency fixes

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run linter
      - Run tests
      - Upload coverage
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to ECR
  
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - Deploy to ECS
      - Run smoke tests
      - Notify Slack
```

## 📖 Additional Documentation

- [Architecture Deep Dive](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Best Practices](./docs/security.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Contributing

This is a portfolio project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🙋 Author

**Saketh Chintala**
- LinkedIn: [linkedin.com/in/saketh-chintala](https://www.linkedin.com/in/saketh-chintala/)
- GitHub: [github.com/sakethchintala](https://github.com/sakethchintala)
- Email: sakethchinthala@gmail.com

## 🎯 Project Goals

This project demonstrates:

1. ✅ **Enterprise Architecture**: Multi-tenant SaaS patterns used by industry leaders
2. ✅ **Full-Stack Proficiency**: React + TypeScript + Node.js + PostgreSQL + MongoDB
3. ✅ **AI Integration**: Practical use of OpenAI for business insights
4. ✅ **Security Expertise**: Production-grade authentication and data protection
5. ✅ **Scalability Design**: Horizontal scaling and database optimization
6. ✅ **Clean Code**: SOLID principles, design patterns, comprehensive tests
7. ✅ **DevOps Mindset**: CI/CD, monitoring, infrastructure as code

---

**Built with ❤️ for demonstrating production-ready software engineering practices**

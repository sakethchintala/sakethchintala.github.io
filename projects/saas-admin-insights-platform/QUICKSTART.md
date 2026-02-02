# Quick Start Guide

Get the SaaS Admin & Insights Platform running in 5 minutes!

## Prerequisites

- **Node.js 20+** and npm
- **Docker Desktop** (for databases)
- **OpenAI API Key** (optional, for AI features)

## 1. Start Databases with Docker

```bash
cd projects/saas-admin-insights-platform

# Start PostgreSQL, MongoDB, and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

## 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your OpenAI API key (optional)
# OPENAI_API_KEY=sk-your-key-here

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with demo data
npm run seed

# Start backend server
npm run dev
```

Backend will be running at: `http://localhost:3000`

## 3. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start frontend dev server
npm run dev
```

Frontend will be running at: `http://localhost:5173`

## 4. Login with Demo Account

Open your browser to `http://localhost:5173` and login with:

```
Email: demo@acmecorp.com
Password: Demo123!
```

Or register a new tenant account!

## 🎉 You're Ready!

Explore the platform:
- 📊 **Dashboard**: Overview of metrics
- 📈 **Analytics**: Detailed charts and trends
- 🤖 **AI Insights**: Generate intelligent recommendations
- 👥 **Users**: Manage user accounts
- 📝 **Audit Logs**: View activity trail

## Troubleshooting

### Backend won't start

**Issue:** Database connection failed

**Solution:**
```bash
# Check if databases are running
docker-compose ps

# Restart databases
docker-compose restart
```

### Frontend can't connect to backend

**Issue:** CORS or connection refused

**Solution:**
- Verify backend is running at `http://localhost:3000`
- Check `.env` files have correct URLs
- Restart both services

### AI Insights not working

**Issue:** OpenAI API key not configured

**Solution:**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`: `OPENAI_API_KEY=sk-...`
3. Restart backend: `npm run dev`

**Note:** AI insights will fallback to rule-based insights if API key is missing

## Next Steps

- Read [README.md](./README.md) for full documentation
- Review [Architecture docs](./docs/architecture.md)
- Explore the codebase and customize!

## Stop Services

```bash
# Stop databases
docker-compose down

# Stop backend/frontend (Ctrl+C in terminals)
```

## Need Help?

- 📧 Email: sakethchinthala@gmail.com
- 💼 LinkedIn: [linkedin.com/in/saketh-chintala](https://www.linkedin.com/in/saketh-chintala/)
- 💻 GitHub Issues: [github.com/sakethchintala/sakethchintala.github.io/issues](https://github.com/sakethchintala/sakethchintala.github.io/issues)

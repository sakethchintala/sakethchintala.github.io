# SaaS Platform - Static Demo

This is a **static demo version** of the SaaS Admin & Insights Platform, created for portfolio showcase purposes. It demonstrates the UI/UX without requiring backend infrastructure.

## 🌐 Live Demo

**View the demo**: [https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/](https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/)

## 📋 What's Included

This static demo showcases:

✅ **Dashboard** - Overview with key metrics  
✅ **Analytics** - Charts and usage trends  
✅ **AI Insights** - Mock AI-generated recommendations  
✅ **Users** - User management interface  
✅ **Audit Logs** - Activity timeline  

## 🔄 Static vs Full Version

| Feature | Static Demo | Full Application |
|---------|-------------|------------------|
| **UI/UX** | ✅ Complete | ✅ Complete |
| **Navigation** | ✅ Works | ✅ Works |
| **Data** | 📊 Mock/Hardcoded | 📊 Real from Database |
| **Authentication** | ❌ Not functional | ✅ JWT with refresh tokens |
| **AI Insights** | 📝 Predefined examples | 🤖 Real OpenAI integration |
| **User Management** | 📝 Static list | ✅ Full CRUD operations |
| **Analytics** | 📊 Mock charts | 📈 Real-time metrics |
| **Backend API** | ❌ Not needed | ✅ Node.js + Express |
| **Databases** | ❌ Not needed | ✅ PostgreSQL + MongoDB + Redis |

## 🚀 Deploying Full Application

If you want to run the **full application** with real backend:

### Option 1: Local Development

```bash
# Start databases
docker-compose up -d

# Backend
cd backend
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

### Option 2: Deploy to Free Cloud Platforms

#### Backend: Render.com (Free Tier)

1. **Create account** at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Build Command: `cd backend && npm install && npx prisma generate`
   - Start Command: `cd backend && npm start`
   - Add Environment Variables:
     - `DATABASE_URL` (from Render PostgreSQL)
     - `MONGODB_URI` (from MongoDB Atlas)
     - `REDIS_URL` (from Upstash)
     - `OPENAI_API_KEY`
     - `JWT_SECRET`
     - `JWT_REFRESH_SECRET`

#### Databases: Free Hosting

**PostgreSQL**: Render.com (free tier)  
**MongoDB**: MongoDB Atlas (free tier)  
**Redis**: Upstash (free tier)  

#### Frontend: Vercel/Netlify

1. **Create account** at https://vercel.com
2. **Import project** → Connect GitHub
3. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Environment Variables:
     - `VITE_API_URL` = Your Render backend URL

## 📱 Mobile Responsive

The demo is fully responsive and works on:
- 📱 Mobile devices
- 📱 Tablets
- 💻 Desktops

## 🎨 Technology

**Static Demo**: Pure HTML, CSS, JavaScript  
**Full App**: React 18, TypeScript, Node.js, PostgreSQL, MongoDB, Redis, OpenAI

## 📖 Documentation

- [Full README](../README.md)
- [Architecture Docs](../docs/architecture.md)
- [Quick Start Guide](../QUICKSTART.md)
- [Project Summary](../PROJECT_SUMMARY.md)

## 💼 Portfolio Use

This static demo is perfect for:
- Quick portfolio showcase
- Job applications (no backend setup needed)
- Demonstrating UI/UX skills
- Sharing with recruiters

For **technical interviews**, mention:
- Full source code available on GitHub
- Can deploy full version with real backend
- Production-ready architecture documented

## 🔗 Links

- **GitHub**: https://github.com/sakethchintala/sakethchintala.github.io/tree/main/projects/saas-admin-insights-platform
- **Portfolio**: https://sakethchintala.github.io/
- **LinkedIn**: https://linkedin.com/in/saketh-chintala/

---

**Created by Saketh Chintala** | Software Engineer II @ Walmart Global Technology

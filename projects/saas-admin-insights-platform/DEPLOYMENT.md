# Deployment Guide

This guide covers all options for deploying the SaaS Admin & Insights Platform online.

## 🎯 Two Versions Available

### 1. Static Demo (Recommended for Portfolio) ✅

**Perfect for:**
- Quick portfolio showcase
- Job applications
- Sharing with recruiters
- No infrastructure setup needed

**Access:** Once merged to main branch:
```
https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/
```

**What it includes:**
- ✅ All UI pages (Dashboard, Analytics, AI Insights, Users, Audit Logs)
- ✅ Interactive navigation
- ✅ Mock data for demonstration
- ✅ Mobile responsive
- ❌ No real backend (static HTML/CSS/JS)

### 2. Full Application (Production-Grade) 🚀

**Perfect for:**
- Technical interviews
- Demonstrating full-stack skills
- Actually using the platform
- Showing real AI integration

**What it includes:**
- ✅ Complete backend API
- ✅ Real databases (PostgreSQL, MongoDB, Redis)
- ✅ OpenAI integration
- ✅ User authentication
- ✅ Real-time data

---

## 🚀 Deploying Full Application

### Option A: Free Cloud Deployment (No Credit Card Required)

#### Step 1: Setup Databases (Free Tier)

**PostgreSQL** - Render.com:
1. Go to https://render.com/
2. Create account (free)
3. New → PostgreSQL
4. Name: `saas-platform-db`
5. Copy the **Internal Database URL**

**MongoDB** - MongoDB Atlas:
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Database Access → Add User
4. Network Access → Add IP (0.0.0.0/0 for development)
5. Connect → Get connection string

**Redis** - Upstash:
1. Go to https://upstash.com/
2. Create account (free)
3. Create Redis Database
4. Copy the connection URL

#### Step 2: Deploy Backend

**Using Render.com (Free):**

1. Go to https://render.com/
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   ```yaml
   Name: saas-platform-api
   Root Directory: backend
   Environment: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy
   Start Command: npm start
   Plan: Free
   ```

5. Add Environment Variables:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<from Step 1>
   MONGODB_URI=<from Step 1>
   REDIS_URL=<from Step 1>
   JWT_SECRET=<generate random 32+ char string>
   JWT_REFRESH_SECRET=<generate random 32+ char string>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   OPENAI_API_KEY=<your OpenAI key>
   FRONTEND_URL=<your frontend URL from Step 3>
   BCRYPT_ROUNDS=12
   ```

6. Deploy!

**Your backend will be at**: `https://saas-platform-api.onrender.com`

#### Step 3: Deploy Frontend

**Using Vercel (Free):**

1. Go to https://vercel.com/
2. Import Git Repository
3. Configure:
   ```yaml
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. Add Environment Variables:
   ```env
   VITE_API_URL=<your backend URL from Step 2>
   ```

5. Deploy!

**Your frontend will be at**: `https://saas-platform.vercel.app`

---

### Option B: Deploy to Railway (Alternative to Render)

**Railway** is another excellent free option:

1. Go to https://railway.app/
2. New Project → Deploy from GitHub
3. Add PostgreSQL, MongoDB, Redis services
4. Configure environment variables
5. Deploy!

**Pros**: Easier setup, built-in databases  
**Cons**: Free tier limits (500 hours/month)

---

### Option C: Local Access (For Development)

```bash
# Clone repository
git clone https://github.com/sakethchintala/sakethchintala.github.io.git
cd sakethchintala.github.io/projects/saas-admin-insights-platform

# Start databases
docker-compose up -d

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your OpenAI API key
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Access at: `http://localhost:5173`

---

## 🔒 Security Checklist for Production

Before deploying to production:

- [ ] Change default JWT secrets
- [ ] Add proper CORS origins
- [ ] Enable HTTPS only
- [ ] Set up environment variables (never commit secrets)
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Enable logging and monitoring
- [ ] Add health check endpoints
- [ ] Configure proper SMTP for emails
- [ ] Set up error tracking (e.g., Sentry)

---

## 💰 Cost Breakdown

### Free Tier (For Portfolio)

| Service | Provider | Cost |
|---------|----------|------|
| **Backend** | Render.com | Free (sleeps after 15 min inactivity) |
| **PostgreSQL** | Render.com | Free (limited storage) |
| **MongoDB** | Atlas | Free (512 MB) |
| **Redis** | Upstash | Free (10K commands/day) |
| **Frontend** | Vercel | Free (unlimited) |
| **OpenAI API** | OpenAI | ~$0.01-0.10/day (pay as you go) |
| **Total** | | **~$3-5/month** (OpenAI usage only) |

### Production Tier (If scaling)

| Service | Provider | Cost |
|---------|----------|------|
| **Backend** | Render.com Pro | $7/month |
| **PostgreSQL** | Render.com | $7/month |
| **MongoDB** | Atlas M10 | $57/month |
| **Redis** | Upstash Pro | $10/month |
| **Frontend** | Vercel Pro | $20/month |
| **OpenAI API** | OpenAI | $50-200/month |
| **Total** | | **~$150-300/month** |

---

## 🎓 For Job Applications

### What to Show

**Static Demo** for quick showcase:
```
Portfolio: https://sakethchintala.github.io/
Demo: https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/
```

**Full Source Code** for technical review:
```
GitHub: https://github.com/sakethchintala/sakethchintala.github.io/tree/main/projects/saas-admin-insights-platform
Documentation: https://github.com/sakethchintala/sakethchintala.github.io/blob/main/projects/saas-admin-insights-platform/README.md
```

### In Your Resume

```
SaaS Admin & Insights Platform | Feb 2026
• Developed production-grade multi-tenant SaaS platform with AI-powered insights
• Tech stack: React 18, Node.js, TypeScript, PostgreSQL, MongoDB, OpenAI
• Live demo: https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/
• Source: github.com/sakethchintala/sakethchintala.github.io
```

### In Cover Letters

```
I built a production-ready SaaS platform demonstrating multi-tenancy, AI integration,
and enterprise security practices. You can view the live demo at [link] and explore
the full architecture documentation on GitHub.
```

### In Interviews

**Mention:**
- "I have a live demo you can access, plus full source code"
- "The demo is static for easy showcase, but I can deploy the full application"
- "Architecture documentation explains all design decisions"
- "Production-ready with security best practices"

---

## 🐛 Troubleshooting

### Backend won't start on Render

**Issue**: Build fails

**Solution**:
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is accessible
- Try manual deploy from Render dashboard

### Frontend can't connect to backend

**Issue**: CORS errors

**Solution**:
```javascript
// backend/src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL, // Add your Vercel URL
  credentials: true
}));
```

### AI Insights not working

**Issue**: OpenAI errors

**Solution**:
1. Verify API key is correct
2. Check OpenAI account has credits
3. View backend logs for specific error
4. Fallback rule-based insights should still work

### Database connection failed

**Issue**: Can't connect to database

**Solution**:
- Verify DATABASE_URL format
- Check database is running (Render dashboard)
- Ensure IP whitelist includes 0.0.0.0/0 (for Render)
- Test connection with `npx prisma db pull`

---

## 📊 Monitoring

### Health Check

```bash
# Check if backend is alive
curl https://your-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00Z",
  "uptime": 86400
}
```

### Logs

**Render**: Dashboard → Your Service → Logs  
**Vercel**: Dashboard → Your Project → Deployments → View Function Logs

---

## 🚀 Next Steps After Deployment

1. **Share your demo**: Add to LinkedIn, resume, cover letters
2. **Monitor usage**: Check Render/Vercel analytics
3. **Get feedback**: Share with peers for code review
4. **Keep improving**: Add features, optimize performance
5. **Write blog post**: Document your journey

---

## 📞 Need Help?

**Issues with deployment?**
- Check GitHub Issues: https://github.com/sakethchintala/sakethchintala.github.io/issues
- Email: sakethchinthala@gmail.com
- LinkedIn: https://linkedin.com/in/saketh-chintala/

**Want to customize?**
- Fork the repository
- Follow QUICKSTART.md for local development
- Read Architecture docs for understanding

---

**Built with ❤️ by Saketh Chintala**  
*Software Engineer II @ Walmart Global Technology*

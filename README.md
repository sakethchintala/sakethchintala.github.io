# sakethchintala.github.io

Portfolio website for Saketh Chintala.

This repository showcases production-grade projects demonstrating full-stack development, 
modern web technologies, AI integration, and clean architecture principles.

## 🚀 Featured Projects

### 1. SaaS Admin & Insights Platform

**Production-grade multi-tenant SaaS platform with AI-powered insights**

A comprehensive enterprise-level application demonstrating real-world SaaS architecture patterns 
used by companies like Salesforce, HubSpot, and Atlassian.

**Tech Stack:**
- **Frontend**: React 18, TypeScript, TailwindCSS, TanStack Query
- **Backend**: Node.js, Express, Prisma ORM
- **Databases**: PostgreSQL, MongoDB, Redis
- **AI**: OpenAI GPT-4 integration
- **Security**: JWT auth, RBAC, rate limiting, audit logging

**Key Features:**
- Multi-tenant architecture with row-level isolation
- AI-powered insights and recommendations
- Real-time analytics dashboard with interactive charts
- Role-based access control (Super Admin, Tenant Admin, User, Viewer)
- Comprehensive audit trail for compliance
- RESTful API with proper error handling
- Production-ready security practices

**Links:**
- 🎨 [Live Demo](https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/) - Static demo showcasing UI/UX
- 📖 [Documentation](projects/saas-admin-insights-platform/README.md) - Complete architecture and setup guide
- 🚀 [Deployment Guide](projects/saas-admin-insights-platform/DEPLOYMENT.md) - Cloud deployment instructions
- 📋 [Quick Start](projects/saas-admin-insights-platform/QUICKSTART.md) - 5-minute local setup

**What makes it special:**
- Production-grade architecture with comprehensive documentation
- Real OpenAI integration (not just mock data)
- Multi-database strategy (PostgreSQL + MongoDB + Redis)
- Security best practices following OWASP Top 10
- Deployment-ready with Docker Compose

---

### 2. RetailOps Command Center

**Production-style retail operations dashboard**

A frontend-focused project demonstrating clean architecture, real-time KPI telemetry,
scenario planning, and alert orchestration.

**Tech Stack:**
- Vanilla JavaScript, HTML5, CSS3
- Zero external dependencies
- Canvas-based chart rendering
- Modular state management

**Key Features:**
- Live KPI telemetry with 60-minute sparkline trends
- Store performance table with search and filtering
- Alert stream with severity tags
- Scenario planner for forecast impact
- Theme toggle with local persistence
- Fully accessible (WCAG compliant)

**Links:**
- 🎨 [Live Demo](https://sakethchintala.github.io/projects/retail-ops-command-center/)
- 📖 [Documentation](projects/retail-ops-command-center/README.md)

## 💼 About

**Saketh Chintala**  
Software Engineer II

- 6+ years of experience in full-stack development
- Expert in React, Node.js, TypeScript, and modern web technologies
- Experience with AI/ML integration, cloud platforms (AWS, GCP), and microservices
- Passionate about clean code, scalable architecture, and best practices

**Connect:**
- 🌐 Portfolio: [sakethchintala.github.io](https://sakethchintala.github.io/)
- 💼 LinkedIn: [linkedin.com/in/saketh-chintala](https://www.linkedin.com/in/saketh-chintala/)

---

## 🛠️ Repository Structure

```
sakethchintala.github.io/
├── index.html              # Portfolio homepage
├── projects/
│   ├── saas-admin-insights-platform/
│   │   ├── frontend/       # React + TypeScript app
│   │   ├── backend/        # Node.js + Express API
│   │   ├── demo/           # Static demo version
│   │   ├── docs/           # Architecture documentation
│   │   └── README.md       # Project documentation
│   └── retail-ops-command-center/
│       ├── index.html      # Dashboard app
│       ├── scripts/        # JavaScript modules
│       ├── styles/         # CSS modules
│       └── README.md       # Project documentation
├── og-image.svg            # Social media preview
├── robots.txt              # SEO configuration
└── sitemap.xml             # Site map
```

---

## 🚀 Local Development

### Portfolio Website

To preview the portfolio locally:

```bash
# Clone repository
git clone https://github.com/sakethchintala/sakethchintala.github.io.git
cd sakethchintala.github.io

# Start local server
python -m http.server 5173

# Open browser
open http://localhost:5173
```

### SaaS Platform (Full Application)

To run the complete SaaS platform locally:

```bash
cd projects/saas-admin-insights-platform

# Start databases with Docker
docker-compose up -d

# Backend setup
cd backend
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

Access at: `http://localhost:5173`

See [QUICKSTART.md](projects/saas-admin-insights-platform/QUICKSTART.md) for detailed setup.

---

## 📚 Documentation

### SaaS Admin Platform

- [README.md](projects/saas-admin-insights-platform/README.md) - Complete overview (200+ lines)
- [Architecture.md](projects/saas-admin-insights-platform/docs/architecture.md) - Design decisions (500+ lines)
- [DEPLOYMENT.md](projects/saas-admin-insights-platform/DEPLOYMENT.md) - Cloud deployment guide
- [QUICKSTART.md](projects/saas-admin-insights-platform/QUICKSTART.md) - 5-minute setup
- [PROJECT_SUMMARY.md](projects/saas-admin-insights-platform/PROJECT_SUMMARY.md) - Executive summary

### RetailOps Command Center

- [README.md](projects/retail-ops-command-center/README.md) - Project overview and architecture

## 🎯 Project Highlights

### Technical Skills Demonstrated

**Frontend:**
- React 18 with TypeScript
- Modern hooks (useState, useEffect, custom hooks)
- TanStack Query for server state management
- TailwindCSS for utility-first styling
- Recharts for data visualization
- Responsive design and accessibility

**Backend:**
- Node.js with Express and TypeScript
- RESTful API design
- Prisma ORM for type-safe database access
- JWT authentication with refresh token rotation
- Rate limiting and security middleware
- OpenAI API integration

**Databases:**
- PostgreSQL (relational data)
- MongoDB (time-series, logs)
- Redis (caching, sessions)
- Multi-database strategy

**Architecture:**
- Multi-tenant design patterns
- Role-based access control (RBAC)
- Clean architecture principles
- Separation of concerns
- Comprehensive error handling

**DevOps:**
- Docker Compose for local development
- Environment-based configuration
- Database migrations (Prisma)
- Deployment documentation
- Health check endpoints

---

## 🌟 Why These Projects Stand Out

### SaaS Admin Platform

✅ **Production-Ready**: Not a tutorial project - follows real-world enterprise patterns  
✅ **Comprehensive**: Full-stack with databases, caching, AI integration  
✅ **Well-Documented**: Architecture deep dives and deployment guides  
✅ **Modern Stack**: 2026-current technologies  
✅ **Security-First**: OWASP Top 10 coverage, audit logging  
✅ **AI Integration**: Practical use of OpenAI API, grounded in data  

### RetailOps Command Center

✅ **Zero Dependencies**: Pure JavaScript showcasing core skills  
✅ **Clean Architecture**: Modular design with clear separation  
✅ **Accessible**: WCAG compliant, semantic HTML  
✅ **Performance**: Optimized rendering and state management  

---

## 🔗 Live Demos

- **Portfolio Homepage**: https://sakethchintala.github.io/
- **SaaS Platform Demo**: https://sakethchintala.github.io/projects/saas-admin-insights-platform/demo/
- **RetailOps Dashboard**: https://sakethchintala.github.io/projects/retail-ops-command-center/

---

## 📄 License

MIT License - Free to use, modify, and learn from.

See [LICENSE](projects/saas-admin-insights-platform/LICENSE) for details.

---

## 🤝 Contributing

This is a personal portfolio repository, but suggestions and feedback are welcome!

1. Open an issue to discuss proposed changes
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---

## 📞 Contact

**Saketh Chintala**  
Software Engineer II

- 💼 LinkedIn: [linkedin.com/in/saketh-chintala](https://www.linkedin.com/in/saketh-chintala/)
- 🌐 Portfolio: [sakethchintala.github.io](https://sakethchintala.github.io/)
- 💻 GitHub: [@sakethchintala](https://github.com/sakethchintala)

---

## 📊 Repository Stats

- **Primary Language**: TypeScript, JavaScript
- **Projects**: 2 production-grade applications
- **Documentation**: 2,000+ lines
- **Code**: 5,500+ lines
- **Technologies**: 15+ modern tools and frameworks

---

## SEO and Analytics

- `robots.txt` and `sitemap.xml` are included for search indexing
- Open Graph share cards provided via `og-image.svg`
- To enable GA4 analytics, set the `meta name="analytics-id"` value in `index.html`
- Analytics loader respects Do Not Track

---

**Built with passion to demonstrate production-ready software engineering**

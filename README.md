# ScholarHub API - Production Deployment Guide

## 🚀 Architecture

This is a production-ready Express.js API server using **MongoDB** as the database, with OpenAI web search integration for fetching real scholarships.

### Tech Stack
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB (with Mongoose ODM)
- **AI Integration**: OpenAI Responses API with web_search_preview
- **Scheduling**: node-cron (6-hour intervals)
- **Security**: Helmet, CORS, input validation (Zod)

---

## 📦 Installation

```bash
cd server
npm install
```

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# MongoDB (Production - MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scholarhub?retryWrites=true&w=majority

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Cron Schedule (every 6 hours)
CRON_SCHEDULE=0 */6 * * *
```

---

## 🏃 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

---

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Whitelist your server IP or use `0.0.0.0/0` for testing
4. Create a database user
5. Get your connection string and add to `.env`

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community@7.0  # macOS
# or
sudo apt-get install mongodb  # Ubuntu

# Start MongoDB
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod  # Ubuntu

# Connection String
MONGODB_URI=mongodb://localhost:27017/scholarhub
```

---

## 📊 Database Schema

### Scholarships Collection
```typescript
{
  title: String (required)
  organization: String (required)
  country: String (required)
  level: String (required) // Bachelor, Master, PhD, Any
  field: String (required)
  category: String (required) // Merit-Based, Need-Based, etc.
  deadline: Date (required)
  description: String (required)
  link: String (required)
  amount: String
  currency: String
  is_verified: Boolean (default: false)
  source: String
  created_at: Date
  updated_at: Date
}
```

**Indexes:**
- Unique compound index: `title + organization + deadline`
- Filter indexes: `country`, `level`, `field`, `category`, `deadline`

### FetchLogs Collection
Tracks all OpenAI web search operations for monitoring.

---

## 🔄 API Endpoints

### Health Check
```http
GET /api/health
```

### List Scholarships
```http
GET /api/scholarships?country=USA&level=Master&limit=20&page=1
```

**Query Parameters:**
- `country` - Filter by country
- `level` - Filter by education level
- `field` - Filter by field of study
- `category` - Filter by category
- `search` - Full-text search
- `page` - Page number (default: 1)
- `limit` - Results per page (max: 100)
- `sort` - Sort field (deadline, title, country, created_at)
- `order` - Sort order (asc, desc)

### Get Single Scholarship
```http
GET /api/scholarships/:id
```

### Get Filter Options
```http
GET /api/scholarships/filters
```

### Get Statistics
```http
GET /api/scholarships/stats
```

### Get Fetch Logs
```http
GET /api/scholarships/logs?limit=20
```

### Admin Endpoints (Protected in production)
```http
POST /api/scholarships
PUT /api/scholarships/:id
DELETE /api/scholarships/:id
POST /api/fetch-now  # Manual trigger for OpenAI fetch
```

---

## 🤖 OpenAI Integration

The server uses **OpenAI Responses API** with the `web_search_preview` tool to fetch real scholarships from the web.

### Query Rotation Strategy
5 batches of queries rotate every fetch cycle:
1. **Batch 1**: English-speaking countries (USA, UK, Canada, Australia)
2. **Batch 2**: Europe (Germany, France, Netherlands, Sweden)
3. **Batch 3**: Asia & Middle East (Japan, Singapore, UAE, Saudi Arabia)
4. **Batch 4**: Specialized categories (Women in STEM, Need-based, Research)
5. **Batch 5**: Major scholarship foundations

This ensures comprehensive global coverage and prevents redundant searches.

### Deduplication
Scholarships are deduplicated based on:
- Title
- Organization
- Deadline

MongoDB's unique compound index prevents duplicates automatically.

---

## 📅 Cron Scheduler

The server runs automated scholarship fetches every 6 hours:
```
0 */6 * * *  (at 12am, 6am, 12pm, 6pm)
```

To change the schedule, update `CRON_SCHEDULE` in `.env`.

---

## 🔒 Production Hardening

### Security Features
✅ **Helmet.js** - Security headers  
✅ **CORS** - Cross-origin protection  
✅ **Input validation** - Zod schemas  
✅ **Rate limiting** - (TODO: Add express-rate-limit)  
✅ **Environment variables** - Sensitive data protection  

### Database Optimizations
✅ **Connection pooling** - 10 connections max, 2 min  
✅ **Indexes** - Optimized for common queries  
✅ **Retry logic** - Automatic reconnection  
✅ **Graceful shutdown** - Clean connection closure  

### Error Handling
✅ **Async error handling** - All routes use try/catch  
✅ **MongoDB connection monitoring** - Logs errors/reconnections  
✅ **OpenAI error handling** - Validates and filters results  

---

## 🚀 Deployment

### Option 1: Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t scholarhub-api .
docker run -p 3001:3001 --env-file .env scholarhub-api
```

### Option 2: PM2 (Process Manager)

```bash
npm install -g pm2

# Start server
pm2 start npm --name "scholarhub-api" -- start

# Monitor
pm2 monit

# View logs
pm2 logs scholarhub-api

# Restart
pm2 restart scholarhub-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Option 3: Cloud Platforms

#### Heroku
```bash
heroku create scholarhub-api
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set OPENAI_API_KEY=your-key
git push heroku main
```

#### Render / Railway / Fly.io
1. Connect your GitHub repo
2. Set environment variables in dashboard
3. Deploy!

---

## 📈 Monitoring

### Health Check Endpoint
Monitor server health:
```bash
curl https://your-api.com/api/health
```

### Database Monitoring
Use MongoDB Atlas built-in monitoring or tools like:
- **Datadog**
- **New Relic**
- **MongoDB Compass**

### Logs
- Server logs: `server/server.log`
- Fetch logs: `/api/scholarships/logs`

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh --eval "db.version()"

# Test connection string
mongosh "mongodb+srv://..."
```

### OpenAI API Errors
- Check API key validity
- Verify billing status
- Check rate limits

### Port Already in Use
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

---

## 📝 Development Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "seed": "tsx src/scripts/seed.ts"
}
```

---

## 🔄 Migration from SQLite

The migration from SQLite to MongoDB is **complete**. All data persistence, queries, and operations now use MongoDB.

### What Changed
- ✅ Database layer completely rewritten for Mongoose
- ✅ All routes converted to async/await
- ✅ Scholarship IDs changed from integers to ObjectIds
- ✅ Query syntax converted to MongoDB operators
- ✅ Connection pooling and error handling added
- ✅ Graceful shutdown implemented

### Old SQLite Files
Backed up as `database.ts.bak` (can be deleted).

---

## 📞 Support

For issues or questions:
- Check logs: `tail -f server/server.log`
- MongoDB connection: Test with `mongosh`
- API health: `curl http://localhost:3001/api/health`

---

## 📄 License

MIT

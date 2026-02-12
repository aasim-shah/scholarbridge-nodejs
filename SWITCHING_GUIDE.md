# 🎯 How to Switch AI Models - Visual Guide

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
│  (Cron Jobs, API Routes, Services)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ calls searchScholarships()
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              AIServiceManager (Singleton)                    │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Reads: AI_PROVIDER environment variable       │        │
│  │  - openai  → OpenAIProvider                    │        │
│  │  - gemini  → GeminiProvider                    │        │
│  │  - grok    → GrokProvider                      │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────┴──────────┐
            │                    │
            ▼                    ▼
    ┌──────────────┐     ┌──────────────┐
    │ If AI_PROVIDER    │ If AI_PROVIDER    │
    │ = "gemini"   │     │ = "grok"     │
    └──────┬───────┘     └──────┬───────┘
           │                    │
           ▼                    ▼
┌──────────────────┐   ┌──────────────────┐
│ GeminiProvider   │   │  GrokProvider    │
│                  │   │                  │
│ Uses:            │   │ Uses:            │
│ - gemini-1.5-flash│  │ - grok-beta     │
│ - FREE (15/min)  │   │ - $25 credits   │
└──────┬───────────┘   └──────┬───────────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │   Web Search & Return   │
    │   Scholarship Data      │
    └─────────────────────────┘
```

## 🔌 How to "Plug" a New Model

### Option 1: One-Line Change (Easiest)

**Before:** (Using OpenAI - costs money)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-abc123...
```

**After:** (Using Gemini - FREE)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy_xyz789...
```

**Restart server** → Done! ✅

---

### Option 2: Programmatic Switch (Advanced)

```typescript
// In your code (e.g., admin panel or API route)
import { switchAIProvider } from './services/ai';

// User clicks "Use Gemini"
app.post('/admin/switch-ai', (req, res) => {
  const provider = req.body.provider; // 'openai', 'gemini', or 'grok'
  
  switchAIProvider(provider);
  
  res.json({ 
    success: true, 
    message: `Switched to ${provider}` 
  });
});
```

---

## 🎮 Live Example

### Scenario: You Want to Save Money

1. **Currently using OpenAI** (costing $50/month)
   ```
   [Server] AI Provider: openai
   [Server] ✅ Found 45 scholarships
   [Cost] -$2.50 for this batch
   ```

2. **Switch to Gemini** (FREE tier)
   ```bash
   # Edit .env
   AI_PROVIDER=gemini
   
   # Restart
   npm run dev
   ```

3. **Now using Gemini** (FREE!)
   ```
   [Server] AI Provider: gemini
   [Server] ✅ Found 43 scholarships
   [Cost] $0.00 (free tier)
   ```

---

## 📊 What Changes When You Switch?

| What | OpenAI | Gemini | Grok |
|------|--------|--------|------|
| **Your Code** | No change | No change | No change |
| **API Endpoint** | api.openai.com | generativelanguage.googleapis.com | api.x.ai |
| **Model** | gpt-4o | gemini-1.5-flash | grok-beta |
| **Cost** | $2.50/batch | FREE | FREE ($25 credits) |
| **Speed** | ~8 seconds | ~5 seconds | ~6 seconds |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Important:** The scholarship data quality is similar across all providers because they all do web searches. The main difference is cost and speed!

---

## 🔄 Real-Time Switching Example

```typescript
// Morning: Use Gemini (free tier)
switchAIProvider('gemini');
await searchScholarships(['medical']);
// Cost: $0

// Afternoon: Free tier limit reached
// Temporarily switch to Grok
switchAIProvider('grok');
await searchScholarships(['engineering']);
// Cost: ~$0.05 (from $25 monthly credits)

// Evening: Important update, need best quality
switchAIProvider('openai');
await searchScholarships(['prestigious']);
// Cost: ~$2.50 (but highest quality)

// Next day: Back to Gemini
switchAIProvider('gemini');
// Cost: $0 (limits reset daily)
```

---

## 🎯 Best Practice Recommendation

### Development Environment
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
```
✅ Free, fast iterations, no cost

### Production Environment (Option 1: Cost-Optimized)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
```
✅ Still free for moderate usage

### Production Environment (Option 2: Quality-First)
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
```
✅ Best quality, worth the cost for production

### Production Environment (Option 3: Hybrid)
Set up a cron job that:
- Uses Gemini for regular updates (4x per day)
- Uses OpenAI for weekly comprehensive scan
- Uses Grok as fallback when Gemini hits limits

---

## 📝 Summary

**To switch AI providers:**

1. **Edit `.env`** → Change `AI_PROVIDER=gemini`
2. **Restart server** → `npm run dev`
3. **Done!** → Check logs to confirm

**Your code never changes.** The AIServiceManager handles everything automatically!

**Test it:**
```bash
npm run test:ai
```

This will show you which provider is active and test a real search.

---

## 💡 Pro Tips

1. **Keep all API keys in .env**
   ```env
   # You can have all three at once!
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=AIza...
   GROK_API_KEY=xai-...
   
   # Just change this line to switch
   AI_PROVIDER=gemini
   ```

2. **Monitor costs**
   - Check your API dashboard weekly
   - Set up billing alerts
   - Start with Gemini, upgrade if needed

3. **Test before switching in production**
   ```bash
   # Test locally first
   AI_PROVIDER=gemini npm run dev
   
   # If good, deploy with new provider
   ```

4. **Fallback strategy**
   ```typescript
   try {
     await searchScholarships(queries);
   } catch (error) {
     console.log('Primary provider failed, switching...');
     switchAIProvider('grok'); // Automatic fallback
     await searchScholarships(queries);
   }
   ```

---

🎉 **You now have complete control over your AI costs without touching any application code!**

# 🚀 Quick Start: AI Provider Setup

## Switch Between AI Providers in 30 Seconds

### 1️⃣ Choose Your Provider

**Gemini (FREE - Recommended for testing)**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

**Grok (FREE - $25/month credits)**
```env
AI_PROVIDER=grok
GROK_API_KEY=your_key_here
```

**OpenAI (PAID - Most accurate)**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

### 2️⃣ Get API Keys

**Gemini (FREE):**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy key

**Grok (FREE $25/month):**
1. Go to: https://console.x.ai/
2. Sign up with Twitter/email
3. Navigate to API Keys
4. Create new key

**OpenAI (PAID):**
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Add payment method

### 3️⃣ Update .env File

Open `server/.env` and add:

```env
# Choose one: openai, gemini, or grok
AI_PROVIDER=gemini

# Add your keys (only the one you're using needs to be filled)
GEMINI_API_KEY=AIzaSyABC123...
GROK_API_KEY=xai-ABC123...
OPENAI_API_KEY=sk-ABC123...
```

### 4️⃣ Restart Server

```bash
cd server
npm run dev
```

That's it! ✅

## 💰 Cost Comparison

| Provider | Free Tier | Cost (per 1M tokens) | Speed | Accuracy |
|----------|-----------|----------------------|-------|----------|
| **Gemini** | ✅ 15 req/min | $0.075/$0.30 | ⚡⚡⚡ Fast | ⭐⭐⭐ Good |
| **Grok** | ✅ $25/month | $5/$15 | ⚡⚡ Medium | ⭐⭐⭐⭐ Great |
| **OpenAI** | ❌ None | $2.50/$10 | ⚡ Slower | ⭐⭐⭐⭐⭐ Best |

**Recommendation:** Start with Gemini for development, use OpenAI for production quality.

## 🔄 Switching Providers

### Method 1: Environment Variable (Recommended)
Just change `AI_PROVIDER` in `.env` and restart:
```env
AI_PROVIDER=grok  # That's it!
```

### Method 2: Programmatically (Advanced)
```typescript
import { switchAIProvider } from './services/ai';

// Switch to different provider at runtime
switchAIProvider('gemini');  // or 'grok' or 'openai'
```

## ✅ Test Your Setup

```bash
cd server
npm run dev
```

Watch the server logs - you'll see:
```
Starting scholarship update...
AI Provider: gemini
✅ Batch complete. Found 45 scholarships
```

## 🔍 Troubleshooting

**Error: "Provider 'gemini' is not configured"**
- Add `GEMINI_API_KEY` to your `.env` file

**Error: "API key not valid"**
- Check your API key is correct
- Verify it's not expired
- Make sure there are no extra spaces

**Error: "Rate limit exceeded"**
- Gemini: Max 15 requests/minute (free tier)
- Wait 1 minute and try again
- Or upgrade to paid tier

**No results found**
- Check your internet connection
- Verify API key has web search permissions
- Try a different provider

## 📚 Full Documentation

See `AI_PROVIDER_SETUP.md` for complete details including:
- Query customization
- Batch processing
- Error handling
- Performance tuning
- Security best practices

## 🆘 Need Help?

1. Check logs: `npm run dev` shows provider name and errors
2. Test with demo: `ts-node src/services/ai/DEMO.ts`
3. Verify keys are set: `echo $AI_PROVIDER` (or check .env)
4. Read full docs: `cat AI_PROVIDER_SETUP.md`

---

**Ready to save money?** Set up Gemini today and get started for FREE! 🎉

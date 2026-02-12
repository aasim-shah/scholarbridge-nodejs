# AI Provider Setup Guide - ScholarBridge

## Overview

ScholarBridge now supports **multiple AI providers** for web search and scholarship extraction:

- **OpenAI (GPT-4o)** - Premium, most accurate, requires payment
- **Google Gemini (1.5 Flash)** - **FREE tier available** (60 requests/min)
- **xAI Grok** - **FREE tier available** (Elon Musk's AI)

You can easily switch between providers by updating a single environment variable!

---

## 🚀 Quick Start

### 1. Choose Your Provider

Edit your `.env` file and set the `AI_PROVIDER` variable:

```env
# Options: openai | gemini | grok
AI_PROVIDER=gemini
```

### 2. Add Your API Key

Based on your chosen provider, uncomment and add your API key:

#### For OpenAI:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here
```

#### For Gemini (FREE):
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key-here
```

#### For Grok (FREE):
```env
AI_PROVIDER=grok
GROK_API_KEY=your-grok-key-here
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Start the Server

```bash
npm run dev
```

The server will automatically use your selected AI provider!

---

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-proj-...`)
5. **Note:** Requires payment, ~$0.01-0.03 per query

### Google Gemini API Key (FREE)
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy your key
5. **Free tier:** 60 requests per minute!

### xAI Grok API Key (FREE)
1. Go to [https://x.ai/](https://x.ai/)
2. Sign up for xAI account
3. Navigate to API keys section
4. Create a new API key
5. Copy your key
6. **Free tier available** for testing

---

## 💰 Cost Comparison

| Provider | Free Tier | Cost (per 1M tokens) | Best For |
|----------|-----------|---------------------|----------|
| **OpenAI GPT-4o** | No | $2.50 input / $10 output | Maximum accuracy |
| **Gemini 1.5 Flash** | ✅ Yes (60 req/min) | $0.075 / $0.30 | Free testing, cost efficiency |
| **Grok** | ✅ Yes (limited) | TBD | Experimental, free tier |

### Recommended Strategy:
1. **Start with Gemini** (free tier) for testing
2. Switch to **OpenAI** if you need better accuracy and have budget
3. Try **Grok** as an alternative free option

---

## 🔄 Switching Providers

### Method 1: Environment Variable (Recommended)

Edit `.env` file:
```env
# Change this line
AI_PROVIDER=gemini  # or openai, or grok
```

Restart the server:
```bash
npm run dev
```

### Method 2: Runtime Switching (Programmatic)

You can also switch providers programmatically in your code:

```typescript
import { switchAIProvider, getProviderName } from './services/ai/index.js';

// Switch to Gemini
switchAIProvider('gemini');
console.log(`Now using: ${getProviderName()}`);

// Switch to OpenAI
switchAIProvider('openai');

// Switch to Grok
switchAIProvider('grok');
```

### Method 3: Check Available Providers

```typescript
import { getAvailableProviders } from './services/ai/index.js';

const providers = getAvailableProviders();
console.log(providers);
// [
//   { provider: 'openai', configured: true, current: false },
//   { provider: 'gemini', configured: true, current: true },
//   { provider: 'grok', configured: false, current: false }
// ]
```

---

## 📋 Complete .env Example

```env
# ═══════════════════════════════════════════════════════════
# AI PROVIDER CONFIGURATION
# ═══════════════════════════════════════════════════════════
# Choose which AI provider to use for scholarship web search
# Options: openai | gemini | grok
AI_PROVIDER=gemini

# OpenAI API Key (for OpenAI provider)
# OPENAI_API_KEY=sk-proj-your-key-here

# Google Gemini API Key (for Gemini provider - FREE TIER)
GEMINI_API_KEY=your-gemini-key-here

# xAI Grok API Key (for Grok provider - FREE TIER)
# GROK_API_KEY=your-grok-key-here

# ═══════════════════════════════════════════════════════════
# SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════════
PORT=9003
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
CRON_SCHEDULE=0 */6 * * *

# ═══════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scholarbridge

# ═══════════════════════════════════════════════════════════
# EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════════════
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
MAIL_FROM=info@scholarbridge.com

# ═══════════════════════════════════════════════════════════
# JWT SECRETS
# ═══════════════════════════════════════════════════════════
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d
```

---

## 🏗️ Architecture

### File Structure

```
server/src/services/ai/
├── index.ts              # Main AI service manager
├── types.ts              # TypeScript interfaces
├── utils.ts              # Shared utilities (link validation, etc.)
├── queries.ts            # Search query batches
├── openai.provider.ts    # OpenAI implementation
├── gemini.provider.ts    # Gemini implementation
└── grok.provider.ts      # Grok implementation
```

### How It Works

1. **AIServiceManager** reads `AI_PROVIDER` from environment
2. Initializes the corresponding provider (OpenAI/Gemini/Grok)
3. All providers implement the same `AIServiceProvider` interface
4. Your code calls the AI service without knowing which provider is active
5. Easy to switch providers without code changes!

### Provider Interface

All AI providers must implement:

```typescript
interface AIServiceProvider {
  searchScholarships(query: string): Promise<ParsedScholarship[]>;
  getProviderName(): string;
  isConfigured(): boolean;
}
```

---

## 🧪 Testing Different Providers

### Test Script

Create a test file `test-providers.ts`:

```typescript
import { aiService } from './services/ai/index.js';

async function testProviders() {
  const providers = ['gemini', 'openai', 'grok'] as const;
  
  for (const provider of providers) {
    try {
      aiService.switchProvider(provider);
      console.log(`\n Testing ${provider.toUpperCase()}...`);
      
      const results = await aiService.searchScholarships(
        'MIT scholarships international students 2026'
      );
      
      console.log(`✓ Found ${results.length} scholarships`);
    } catch (error) {
      console.error(`✗ ${provider} failed:`, error.message);
    }
  }
}

testProviders();
```

---

## ⚠️ Troubleshooting

### "No provider initialized" Error

**Solution:** Make sure you have set both `AI_PROVIDER` and the corresponding API key in `.env`

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here  # Must be set!
```

### "API key not found" Warning

**Solution:** Check that your API key is:
1. Correctly set in `.env`
2. Not commented out (no `#` at the start)
3. The correct key for your chosen provider

### Rate Limiting Issues

**For Gemini:**
- Free tier: 60 requests/minute
- Add delays between requests if needed

**For OpenAI:**
- Default: 3 requests/minute (tier 1)
- Upgrade tier for higher limits

**Solution:** Adjust `CRON_SCHEDULE` in `.env` to run less frequently:
```env
CRON_SCHEDULE=0 */12 * * *  # Every 12 hours instead of 6
```

---

## 📊 Monitoring

Check which provider is active:

```bash
# In logs, you'll see:
[AI Service] ✓ Initialized with Gemini provider
[CRON] AI Provider: Gemini
[Gemini] Found 5 scholarships from web search
```

---

## 🎯 Best Practices

1. **Start Free:** Begin with Gemini to test everything
2. **Monitor Costs:** Track your API usage for paid providers
3. **Set Limits:** Configure rate limiting to avoid unexpected bills
4. **Use Cron Wisely:** Don't run searches too frequently
5. **Test Locally:** Always test with free tier before production

---

## 🔒 Security Notes

- Never commit `.env` file to git
- Keep API keys secure and private
- Rotate keys periodically
- Use environment variables in production
- Set up billing alerts for paid providers

---

## 📚 Additional Resources

- **OpenAI Docs:** [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **Gemini Docs:** [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Grok Docs:** [https://x.ai/docs](https://x.ai/docs)

---

## 🆘 Need Help?

1. Check this README first
2. Review error messages in console
3. Verify API keys are valid
4. Test with free tier (Gemini/Grok) first
5. Open an issue if problem persists

---

**Happy Scholarship Hunting! 🎓**

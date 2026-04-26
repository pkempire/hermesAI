# Redis Setup Guide for HermesAI

## ⚠️ The Error You're Seeing

```
Error [UrlError]: Upstash Redis client was passed an invalid URL. 
You should pass a URL starting with https.
```

**Cause:** You're using a traditional Redis connection string instead of Upstash's REST API URL.

---

## ✅ Quick Fix

### Option 1: Use Upstash Redis (Recommended)

1. **Create a free Upstash account**: https://console.upstash.com/
2. **Create a new Redis database**
3. **Copy the REST API credentials**:
   - `UPSTASH_REDIS_REST_URL` - Should start with `https://`
   - `UPSTASH_REDIS_REST_TOKEN` - Your API token

4. **Add to `.env.local`**:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token...XX
```

### Option 2: Skip Redis (Development Only)

The app will work without Redis! Rate limiting will be disabled, but all other features work fine.

**Just remove or comment out** these lines in `.env.local`:
```bash
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
```

---

## 🔍 What You Had

Your `.env` had a traditional Redis URL:
```
redis-10977.c10.us-east-1-4.ec2.redns.redis-cloud.com:10977
```

This is for direct Redis connections (using `redis://`protocol). 

**Upstash uses REST API** (using `https://` protocol) which works better with serverless/edge functions.

---

## 📋 Why Upstash Redis?

1. **Serverless-friendly** - REST API works everywhere
2. **Global edge network** - Low latency
3. **Free tier** - 10k commands/day free
4. **No connection pooling needed** - Stateless HTTP

---

## 🚀 Production Checklist

- [ ] Create Upstash Redis database
- [ ] Add `UPSTASH_REDIS_REST_URL` to environment variables
- [ ] Add `UPSTASH_REDIS_REST_TOKEN` to environment variables  
- [ ] Test rate limiting works
- [ ] Monitor usage in Upstash dashboard

---

## 💡 Rate Limiting Without Redis

If you skip Redis, the app uses in-memory fallback:
- ✅ App still works
- ❌ Rate limits don't persist across server restarts
- ❌ Not suitable for production (users can bypass limits)

**For production, Upstash Redis is required.**

---

Last updated: Sept 30, 2025

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env)
// Fallback to in-memory store if Upstash not configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limiters for different endpoints (only if Redis is configured)
export const chatRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
  prefix: "@hermes/chat",
}) : null

export const prospectSearchRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 searches per hour
  analytics: true,
  prefix: "@hermes/prospect-search",
}) : null

export const emailSendRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"), // 100 emails per day (trial)
  analytics: true,
  prefix: "@hermes/email-send",
}) : null

// Paid tier rate limit (can upgrade based on plan)
export const emailSendRateLimitPaid = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(500, "1 d"), // 500 emails per day (paid)
  analytics: true,
  prefix: "@hermes/email-send-paid",
}) : null

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    : null

/**
 * Check rate limit for a user
 * @param identifier - User ID or IP address
 * @param limiter - The rate limiter to use
 * @returns { success: boolean, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
) {
  // If no limiter (Redis not configured), allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: new Date(Date.now() + 60000),
    }
  }
  
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  
  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  }
}

/**
 * Get user plan from the subscriptions table.
 */
async function getUserPlan(userId: string): Promise<'trial' | 'paid'> {
  if (!supabaseAdmin) {
    return 'trial'
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return 'trial'
  }

  return data?.plan && data.plan !== 'free' ? 'paid' : 'trial'
}

/**
 * Get user-specific rate limiter based on their plan
 */
export async function getUserRateLimiter(userId: string, type: 'email' | 'search' | 'chat') {
  const userPlan = await getUserPlan(userId)
  if (type === 'email') {
    return userPlan === 'paid' ? emailSendRateLimitPaid : emailSendRateLimit
  }
  
  if (type === 'search') {
    return prospectSearchRateLimit
  }
  
  return chatRateLimit
}

/**
 * Format rate limit error message
 */
export function getRateLimitErrorMessage(type: string, reset: Date): string {
  const minutesUntilReset = Math.ceil((reset.getTime() - Date.now()) / 60000)
  
  return `Rate limit exceeded for ${type}. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`
}

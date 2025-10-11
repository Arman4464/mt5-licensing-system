//import { NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs
    }
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function getRateLimitInfo(identifier: string): { count: number; remaining: number; resetIn: number } | null {
  const record = store[identifier]
  if (!record) return null

  const now = Date.now()
  const resetIn = Math.max(0, record.resetTime - now)
  
  return {
    count: record.count,
    remaining: Math.max(0, 10 - record.count),
    resetIn: Math.floor(resetIn / 1000)
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000)

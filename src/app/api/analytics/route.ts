import { NextResponse } from 'next/server'
import { isProduction, isStaging } from '@/lib/utils'

// Simple in-memory analytics store for demonstration
// In production, this would connect to a database or analytics service
const analyticsEvents: any[] = []

export async function POST(request: Request) {
  try {
    // Only accept analytics in production or staging
    if (!isProduction() && !isStaging()) {
      return NextResponse.json(
        { error: 'Analytics only accepted in production/staging' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.event || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: event, timestamp' },
        { status: 400 }
      )
    }

    // Store the event (in production, send to real analytics service)
    const eventWithMeta = {
      ...data,
      receivedAt: new Date().toISOString(),
      environment: isProduction() ? 'production' : 'staging',
      userAgent: request.headers.get('user-agent')
    }
    
    analyticsEvents.push(eventWithMeta)
    
    // Limit store size
    if (analyticsEvents.length > 1000) {
      analyticsEvents.shift()
    }

    return NextResponse.json(
      { success: true, storedEvents: analyticsEvents.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Development only endpoint to view collected analytics
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: 'Analytics view only available in development' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    events: analyticsEvents,
    count: analyticsEvents.length
  })
}

function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}